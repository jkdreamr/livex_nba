#!/usr/bin/env python3
"""
Merge the human-verified labels with the extracted PNGs + sampled colours into
the canonical `assets/catalog.json` that the engine reads. Also renames the
numbered PNGs to self-descriptive `<id>.png` (id == filename stem).

Labels were authored by direct visual inspection of the source-of-truth PDF
grids (see assets/contact_*.png). Team `team` slugs link a graphic to a
franchise for the engine's team lookups; exactly one placement entry per
franchise carries `team` (the canonical logo) so `teamPatch` is unambiguous —
alternates/wordmarks are left team-less but still selectable from the pool.

Run AFTER extract.py:  python3 assets/build_catalog.py
"""
from __future__ import annotations
import json, os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# (num, slug, label, category, team_or_None, [moods])
BACK = [
    (1, "las-vegas-summer-league", "Las Vegas Summer League", "summer_league", None, ["classic", "vegas"]),
    (2, "summer-league", "Summer League", "summer_league", None, ["classic", "vegas"]),
    (3, "nba", "NBA", "nba_league", None, ["classic"]),
    (4, "los-angeles", "Los Angeles", "city_text", None, ["streetwear"]),
    (5, "hawks", "Atlanta Hawks", "team", "hawks", ["classic", "streetwear"]),
    (6, "nets", "Brooklyn Nets", "team", "nets", ["classic", "streetwear"]),
    (7, "celtics", "Boston Celtics", "team", "celtics", ["classic", "streetwear"]),
    (8, "hornets", "Charlotte Hornets", "team", "hornets", ["classic", "streetwear"]),
    (9, "mavericks", "Dallas Mavericks", "team", "mavericks", ["classic", "streetwear"]),
    (10, "nuggets", "Denver Nuggets", "team", "nuggets", ["classic", "streetwear"]),
    (11, "pistons", "Detroit Pistons", "team", "pistons", ["classic", "streetwear"]),
    (12, "warriors", "Golden State Warriors", "team", "warriors", ["classic", "streetwear"]),
    (13, "pacers", "Indiana Pacers", "team", "pacers", ["classic", "streetwear"]),
    (14, "clippers", "LA Clippers", "team", "clippers", ["classic", "streetwear"]),
    (15, "rockets", "Houston Rockets", "team", "rockets", ["classic", "streetwear"]),
    (16, "heat", "Miami Heat", "team", "heat", ["classic", "streetwear"]),
    (17, "bucks", "Milwaukee Bucks", "team", "bucks", ["classic", "streetwear"]),
    (18, "timberwolves", "Minnesota Timberwolves", "team", "timberwolves", ["classic", "streetwear"]),
    (19, "pelicans", "New Orleans Pelicans", "team", "pelicans", ["classic", "streetwear"]),
    (20, "knicks", "New York Knicks", "team", "knicks", ["classic", "streetwear"]),
    (21, "thunder", "Oklahoma City Thunder", "team", "thunder", ["classic", "streetwear"]),
    (22, "suns", "Phoenix Suns", "team", "suns", ["classic", "streetwear"]),
    (23, "trail-blazers", "Portland Trail Blazers", "team", "trail-blazers", ["classic", "streetwear"]),
    (24, "kings", "Sacramento Kings", "team", "kings", ["classic", "streetwear"]),
    (25, "spurs", "San Antonio Spurs", "team", "spurs", ["classic", "streetwear"]),
    (26, "raptors", "Toronto Raptors", "team", "raptors", ["classic", "streetwear"]),
    (27, "jazz", "Utah Jazz", "team", "jazz", ["classic", "streetwear"]),
    (28, "wizards", "Washington Wizards", "team", "wizards", ["classic", "streetwear"]),
    (29, "lakers", "Los Angeles Lakers", "team", "lakers", ["classic", "streetwear"]),
    (30, "cavaliers", "Cleveland Cavaliers", "team", "cavaliers", ["classic", "streetwear"]),
    (31, "magic", "Orlando Magic", "team", "magic", ["classic", "streetwear"]),
    (32, "grizzlies", "Memphis Grizzlies", "team", "grizzlies", ["classic", "streetwear"]),
    (33, "sixers", "Philadelphia 76ers", "team", "sixers", ["classic", "streetwear"]),
]

PLACEMENT = [
    (1, "martini", "Martini", "fun", None, ["vegas", "playful"]),
    (2, "summer-league-2026", "Summer League 2026", "summer_league", None, ["classic", "vegas"]),
    (3, "welcome-to-las-vegas", "Welcome to Las Vegas", "vegas", None, ["vegas"]),
    (4, "what-happens-in-vegas", "What Happens in Vegas", "vegas", None, ["vegas", "playful"]),
    (5, "basketball", "Basketball", "fun", None, ["classic", "streetwear"]),
    (6, "foam-finger", "Foam Finger", "fun", None, ["playful", "streetwear"]),
    (7, "sun", "Sun", "fun", None, ["playful", "vegas"]),
    (8, "planet-basketball", "Planet Basketball", "fun", None, ["playful", "streetwear"]),
    (9, "flower", "Flower", "fun", None, ["playful"]),
    (10, "cherries", "Cherries", "fun", None, ["vegas", "playful"]),
    (11, "pizza", "Pizza", "fun", None, ["playful"]),
    (12, "summer-league-flames", "Summer League Flames", "summer_league", None, ["streetwear", "classic"]),
    (13, "wave", "Wave", "fun", None, ["playful", "streetwear"]),
    (14, "western-conference", "Western Conference", "conference", None, ["classic"]),
    (15, "eastern-conference", "Eastern Conference", "conference", None, ["classic"]),
    (16, "trophy", "Championship Trophy", "fun", None, ["classic"]),
    (17, "evil-eye", "Evil Eye", "fun", None, ["streetwear", "playful"]),
    (18, "summer-league-badge", "Summer League Badge", "summer_league", None, ["streetwear"]),
    (19, "lips", "Lips", "fun", None, ["streetwear", "playful"]),
    (20, "nba-jersey", "NBA Jersey", "nba_league", None, ["classic", "streetwear"]),
    (21, "hoop", "Hoop", "fun", None, ["streetwear"]),
    (22, "net", "Net", "fun", None, ["streetwear"]),
    (23, "rainbow", "Rainbow", "fun", None, ["playful"]),
    (24, "star-purple", "Purple Star", "fun", None, ["streetwear", "playful"]),
    (25, "star-yellow", "Yellow Star", "fun", None, ["playful", "streetwear"]),
    (26, "star-blue", "Blue Star", "fun", None, ["streetwear"]),
    (27, "star-green", "Green Star", "fun", None, ["streetwear", "playful"]),
    (28, "nba-logo", "NBA", "nba_league", None, ["classic"]),
    (29, "shamrock", "Shamrock", "fun", None, ["playful"]),
    (30, "palm-tree", "Palm Tree", "fun", None, ["vegas", "playful"]),
    (31, "basketball-heart", "Basketball Heart", "fun", None, ["streetwear", "playful"]),
    (32, "flaming-heart", "Flaming Heart", "fun", None, ["streetwear"]),
    (33, "i-love-nba", "I Love NBA", "nba_league", None, ["playful", "classic"]),
    (34, "basketball-classic", "Basketball", "fun", None, ["classic", "streetwear"]),
    (35, "summer-league-script", "Summer League Script", "summer_league", None, ["classic", "vegas"]),
    (36, "summer-league-bar", "Summer League Bar", "summer_league", None, ["classic"]),
    (37, "nevada-nba-plate", "Nevada NBA Plate", "vegas", None, ["vegas"]),
    (38, "poker-chips", "Poker Chips", "vegas", None, ["vegas", "playful"]),
    (39, "summer-league-mascot", "Summer League Mascot", "summer_league", None, ["playful"]),
    (40, "flamingo", "Flamingo", "fun", None, ["vegas", "playful"]),
    (41, "summer-league-mini", "Summer League", "summer_league", None, ["classic"]),
    (42, "nba-stamp", "NBA Stamp", "nba_league", None, ["classic"]),
    (43, "los-angeles-lakers-text", "Los Angeles Lakers", "city_text", None, ["streetwear"]),
    (44, "surfboard", "Surfboard", "fun", None, ["vegas", "playful"]),
    (45, "lakers-lips", "Lakers Lips", "fun", None, ["streetwear", "playful"]),
    (46, "lakers-star", "Lakers Star", "fun", None, ["streetwear"]),
    (47, "los-angeles", "Los Angeles", "city_text", None, ["streetwear"]),
    (48, "bulls", "Chicago Bulls", "team", "bulls", ["classic", "streetwear"]),
    (49, "las-vegas-summer-league", "Las Vegas Summer League", "summer_league", None, ["classic", "vegas"]),
    (50, "las-vegas-summer-league-blue", "Las Vegas Summer League", "summer_league", None, ["classic", "vegas"]),
    (51, "las-vegas-summer-league-gold", "Las Vegas Summer League", "summer_league", None, ["classic", "vegas"]),
    (52, "summer-league-heart", "Summer League Heart", "summer_league", None, ["playful", "streetwear"]),
    (53, "sunglasses", "Sunglasses", "fun", None, ["vegas", "playful"]),
    (54, "cactus", "Cactus", "fun", None, ["vegas", "playful"]),
    (55, "sugar-skull", "Sugar Skull", "fun", None, ["playful", "streetwear"]),
    (56, "sugar-skull-2", "Sugar Skull", "fun", None, ["playful", "streetwear"]),
    (57, "pennant-1", "Summer League Pennant", "summer_league", None, ["classic"]),
    (58, "pennant-2", "Summer League Pennant", "summer_league", None, ["classic"]),
    (59, "pennant-3", "Summer League Pennant", "summer_league", None, ["classic"]),
    (60, "pennant-4", "Summer League Pennant", "summer_league", None, ["classic"]),
    (61, "summer-league-text", "Summer League", "summer_league", None, ["classic"]),
    (62, "hawks", "Atlanta Hawks", "team", "hawks", ["classic", "streetwear"]),
    (63, "nets", "Brooklyn Nets", "team", "nets", ["classic", "streetwear"]),
    (64, "celtics", "Boston Celtics", "team", "celtics", ["classic", "streetwear"]),
    (65, "hornets", "Charlotte Hornets", "team", "hornets", ["classic", "streetwear"]),
    (66, "mavericks", "Dallas Mavericks", "team", "mavericks", ["classic", "streetwear"]),
    (67, "nuggets", "Denver Nuggets", "team", "nuggets", ["classic", "streetwear"]),
    (68, "pistons", "Detroit Pistons", "team", "pistons", ["classic", "streetwear"]),
    (69, "warriors", "Golden State Warriors", "team", "warriors", ["classic", "streetwear"]),
    (70, "pacers", "Indiana Pacers", "team", "pacers", ["classic", "streetwear"]),
    (71, "clippers", "LA Clippers", "team", "clippers", ["classic", "streetwear"]),
    (72, "rockets", "Houston Rockets", "team", "rockets", ["classic", "streetwear"]),
    (73, "heat", "Miami Heat", "team", "heat", ["classic", "streetwear"]),
    (74, "bucks", "Milwaukee Bucks", "team", "bucks", ["classic", "streetwear"]),
    (75, "timberwolves", "Minnesota Timberwolves", "team", "timberwolves", ["classic", "streetwear"]),
    (76, "pelicans", "New Orleans Pelicans", "team", "pelicans", ["classic", "streetwear"]),
    (77, "knicks", "New York Knicks", "team", "knicks", ["classic", "streetwear"]),
    (78, "thunder", "Oklahoma City Thunder", "team", "thunder", ["classic", "streetwear"]),
    (79, "suns", "Phoenix Suns", "team", "suns", ["classic", "streetwear"]),
    (80, "trail-blazers", "Portland Trail Blazers", "team", "trail-blazers", ["classic", "streetwear"]),
    (81, "kings", "Sacramento Kings", "team", "kings", ["classic", "streetwear"]),
    (82, "spurs", "San Antonio Spurs", "team", "spurs", ["classic", "streetwear"]),
    (83, "raptors", "Toronto Raptors", "team", "raptors", ["classic", "streetwear"]),
    (84, "jazz", "Utah Jazz", "team", "jazz", ["classic", "streetwear"]),
    (85, "wizards", "Washington Wizards", "team", "wizards", ["classic", "streetwear"]),
    (86, "knicks-wordmark", "New York Knicks", "team", None, ["classic", "streetwear"]),
    (87, "warriors-the-bay", "The Bay", "team", None, ["classic", "streetwear"]),
    (88, "lakers-wordmark", "Los Angeles Lakers", "team", None, ["classic", "streetwear"]),
    (89, "cavaliers", "Cleveland Cavaliers", "team", "cavaliers", ["classic", "streetwear"]),
    (90, "magic", "Orlando Magic", "team", "magic", ["classic", "streetwear"]),
    (91, "grizzlies", "Memphis Grizzlies", "team", "grizzlies", ["classic", "streetwear"]),
    (92, "sixers", "Philadelphia 76ers", "team", "sixers", ["classic", "streetwear"]),
    (93, "lakers", "Los Angeles Lakers", "team", "lakers", ["classic", "streetwear"]),
    (94, "celtics-alt", "Boston Celtics", "team", None, ["classic", "streetwear"]),
]


def build(rows, raw, prefix, subdir):
    out = []
    for num, slug, label, category, team, moods in rows:
        gid = f"{prefix}_{num:02d}_{slug}"
        old = os.path.join(REPO, "public/logos", subdir, f"{num:02d}.png")
        new_name = f"{gid}.png"
        new = os.path.join(REPO, "public/logos", subdir, new_name)
        if os.path.exists(old):
            os.rename(old, new)
        entry = {
            "id": gid, "num": num, "file": f"/logos/{subdir}/{new_name}",
            "label": label, "category": category, "mood": moods,
            "dominantColors": raw[str(num)]["dominantColors"],
        }
        if team:
            entry["team"] = team
        out.append(entry)
    return out


def main():
    raw = json.load(open(os.path.join(REPO, "assets/extract_raw.json")))
    catalog = {
        "back": build(BACK, raw["back"], "back", "back"),
        "placement": build(PLACEMENT, raw["placement"], "plc", "placement"),
    }
    path = os.path.join(REPO, "assets/catalog.json")
    with open(path, "w") as f:
        json.dump(catalog, f, indent=2)

    # sanity report
    back, plc = catalog["back"], catalog["placement"]
    back_teams = [e["team"] for e in back if "team" in e]
    plc_teams = [e["team"] for e in plc if "team" in e]
    print(f"back: {len(back)} (teams {len(back_teams)}, unique {len(set(back_teams))})")
    print(f"placement: {len(plc)} (teams {len(plc_teams)}, unique {len(set(plc_teams))})")
    assert len(back) == 33 and len(plc) == 94, "count mismatch"
    assert len(back_teams) == len(set(back_teams)), "dup back team"
    assert len(plc_teams) == len(set(plc_teams)), "dup placement team"
    all_ids = [e["id"] for e in back + plc]
    assert len(all_ids) == len(set(all_ids)), "dup id"
    print(f"unique ids: {len(set(all_ids))}; placement franchises: {sorted(set(plc_teams))}")
    print(f"wrote {path}")


if __name__ == "__main__":
    main()
