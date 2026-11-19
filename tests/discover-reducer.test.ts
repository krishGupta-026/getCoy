import { describe, expect, it } from "vitest";
import {
  deriveView,
  discoverReducer,
  initialDiscoverState,
  type DiscoverAction,
  type DiscoverState,
} from "@/hooks/useDiscover";
import type { Profile } from "@/lib/types";

const profile = (id: string): Profile => ({
  id,
  name: `Name ${id}`,
  age: 21,
  photo: `/photos/${id}.svg`,
  bio: "bio",
  location: "Delhi",
  interests: ["Music", "Chai", "Books"],
});

const run = (state: DiscoverState, ...actions: DiscoverAction[]) =>
  actions.reduce(discoverReducer, state);
const ids = (profiles: Profile[]) => profiles.map((p) => p.id);

describe("feedLoaded", () => {
  it("appends new profiles to the queue", () => {
    const state = run(initialDiscoverState, { type: "feedLoaded", profiles: [profile("a"), profile("b")] });
    expect(ids(state.queue)).toEqual(["a", "b"]);
    expect(state.exhausted).toBe(false);
  });

  it("drops profiles already in the queue", () => {
    const state = run(
      initialDiscoverState,
      { type: "feedLoaded", profiles: [profile("a"), profile("b")] },
      { type: "feedLoaded", profiles: [profile("b"), profile("c")] },
    );
    expect(ids(state.queue)).toEqual(["a", "b", "c"]);
  });

  it("drops profiles repeated inside one batch", () => {
    const state = run(initialDiscoverState, { type: "feedLoaded", profiles: [profile("a"), profile("a")] });
    expect(ids(state.queue)).toEqual(["a"]);
  });

  it("drops profiles swiped while the request was in flight (race guard)", () => {
    const loaded = run(initialDiscoverState, { type: "feedLoaded", profiles: [profile("a"), profile("b")] });
    // The user swipes "a", then a feed response (generated before that swipe was saved) lands.
    const state = run(
      loaded,
      { type: "swiped", profile: profile("a") },
      { type: "feedLoaded", profiles: [profile("a"), profile("b"), profile("c")] },
    );
    expect(ids(state.queue)).toEqual(["b", "c"]);
  });

  it("marks the deck exhausted when a batch brings nothing new, and un-marks it when it does", () => {
    const loaded = run(initialDiscoverState, { type: "feedLoaded", profiles: [profile("a")] });
    const same = run(loaded, { type: "feedLoaded", profiles: [profile("a")] });
    expect(same.exhausted).toBe(true);
    const empty = run(loaded, { type: "feedLoaded", profiles: [] });
    expect(empty.exhausted).toBe(true);
    expect(run(same, { type: "feedLoaded", profiles: [profile("z")] }).exhausted).toBe(false);
  });

  it("clears a previous feed error", () => {
    const state = run(initialDiscoverState, { type: "feedFailed" }, { type: "feedLoaded", profiles: [profile("a")] });
    expect(state.feedError).toBe(false);
  });
});

describe("swiped / rollback (optimistic swipes)", () => {
  const loaded = run(initialDiscoverState, {
    type: "feedLoaded",
    profiles: [profile("a"), profile("b"), profile("c")],
  });

  it("removes the card immediately and remembers it", () => {
    const state = run(loaded, { type: "swiped", profile: profile("a") });
    expect(ids(state.queue)).toEqual(["b", "c"]);
    expect(state.seenIds.has("a")).toBe(true);
  });

  it("does not mutate the previous state", () => {
    const before = new Set(loaded.seenIds);
    run(loaded, { type: "swiped", profile: profile("a") });
    expect(loaded.seenIds).toEqual(before);
    expect(ids(loaded.queue)).toEqual(["a", "b", "c"]);
  });

  it("a failed swipe puts the card back on top and forgets it was swiped", () => {
    const state = run(
      loaded,
      { type: "swiped", profile: profile("a") },
      { type: "swiped", profile: profile("b") },
      { type: "rollback", profile: profile("a") },
    );
    expect(ids(state.queue)).toEqual(["a", "c"]);
    expect(state.seenIds.has("a")).toBe(false);
    expect(state.seenIds.has("b")).toBe(true);
  });

  it("rollback never creates a duplicate card", () => {
    const state = run(loaded, { type: "rollback", profile: profile("a") });
    expect(ids(state.queue)).toEqual(["a", "b", "c"]);
  });

  it("a swipe clears a feed error so loading can be retried", () => {
    const state = run(loaded, { type: "feedFailed" }, { type: "swiped", profile: profile("a") });
    expect(state.feedError).toBe(false);
  });
});

describe("match queue", () => {
  it("celebrates matches one at a time, in order", () => {
    let state = run(initialDiscoverState, { type: "matched", profile: profile("a") }, { type: "matched", profile: profile("b") });
    expect(ids(state.matchQueue)).toEqual(["a", "b"]);
    state = run(state, { type: "matchDismissed" });
    expect(ids(state.matchQueue)).toEqual(["b"]);
    state = run(state, { type: "matchDismissed" });
    expect(state.matchQueue).toEqual([]);
    expect(run(state, { type: "matchDismissed" }).matchQueue).toEqual([]);
  });

  it("can clear every waiting match at once (View matches)", () => {
    const waiting = run(initialDiscoverState, { type: "matched", profile: profile("a") }, { type: "matched", profile: profile("b") });
    expect(run(waiting, { type: "matchQueueCleared" }).matchQueue).toEqual([]);
    expect(run(initialDiscoverState, { type: "matchQueueCleared" })).toBe(initialDiscoverState);
  });

  it("never queues the same match twice", () => {
    const state = run(initialDiscoverState, { type: "matched", profile: profile("a") }, { type: "matched", profile: profile("a") });
    expect(ids(state.matchQueue)).toEqual(["a"]);
  });

  it("stores the matches list", () => {
    const matches = [{ profile: profile("a"), matchedAt: "2026-11-18T08:00:00.000Z" }];
    expect(run(initialDiscoverState, { type: "matchesLoaded", matches }).matches).toEqual(matches);
  });
});

describe("toasts", () => {
  it("gives every toast a new id", () => {
    const state = run(initialDiscoverState, { type: "toast", message: "one" }, { type: "toast", message: "two" });
    expect(state.toast).toEqual({ id: 2, message: "two" });
  });

  it("only dismisses the toast that asked, never a newer one", () => {
    const state = run(initialDiscoverState, { type: "toast", message: "one" }, { type: "toast", message: "two" });
    expect(run(state, { type: "toastDismissed", id: 1 }).toast?.message).toBe("two");
    expect(run(state, { type: "toastDismissed", id: 2 }).toast).toBeNull();
  });
});

describe("reset", () => {
  it("starts over but keeps toast ids unique, and bumps the epoch", () => {
    const busy = run(
      initialDiscoverState,
      { type: "feedLoaded", profiles: [profile("a")] },
      { type: "swiped", profile: profile("a") },
      { type: "matched", profile: profile("a") },
      { type: "toast", message: "x" },
    );
    const state = run(busy, { type: "reset" });
    expect(state.queue).toEqual([]);
    expect(state.seenIds.size).toBe(0);
    expect(state.matchQueue).toEqual([]);
    expect(state.matches).toBeNull();
    expect(state.toast).toBeNull();
    expect(state.toastSeq).toBe(busy.toastSeq);
    expect(state.epoch).toBe(busy.epoch + 1);
  });
});

describe("deriveView", () => {
  const withCard = run(initialDiscoverState, { type: "feedLoaded", profiles: [profile("a")] });

  it("loading before anything has arrived", () => {
    expect(deriveView(initialDiscoverState)).toBe("loading");
  });
  it("ready whenever there is a card, even after a failed prefetch", () => {
    expect(deriveView(withCard)).toBe("ready");
    expect(deriveView(run(withCard, { type: "feedFailed" }))).toBe("ready");
  });
  it("error when the feed failed and there is nothing to show", () => {
    expect(deriveView(run(initialDiscoverState, { type: "feedFailed" }))).toBe("error");
  });
  it("empty once the last card is swiped and nothing more exists", () => {
    const done = run(withCard, { type: "feedLoaded", profiles: [] }, { type: "swiped", profile: profile("a") });
    expect(deriveView(done)).toBe("empty");
  });
  it("loading (not empty) while the next batch is still being fetched", () => {
    expect(deriveView(run(withCard, { type: "swiped", profile: profile("a") }))).toBe("loading");
  });
  it("a rolled-back card brings the deck back", () => {
    const state = run(withCard, { type: "swiped", profile: profile("a") }, { type: "rollback", profile: profile("a") });
    expect(deriveView(state)).toBe("ready");
  });
});
