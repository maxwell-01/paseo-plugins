# Changelog

Notable changes to `firstmate`. The other plugins in this repository version separately.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the version numbers
follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Every version is published to npm
as `@gpambrozio/paseo-firstmate` and tagged here, so a version is something to install and a line to
read before you move.

## [0.8.0] — 2026-11-26

One screen again: the board of topics is now the main part of the FirstMate screen.

### Changed

- **The board of topics is in the FirstMate screen**, where the chat was. A **Board / General chat**
  switch is the first thing in that pane and stays in the same place in both views. *Board* shows
  *Needs you*, *Working*, *Queued* and *Done*, and one click opens a topic. *General chat* is the
  conversation with the first mate, with who said each message, and without the messages of any backlog
  item: each has its thread on the board.
- **The crew panel starts hidden.** The crew's columns, the Suggestions and Watches cards, Watch and the
  Files view are where they were, on the right, behind the panel button in the header (**Show the crew
  panel**). With the panel shown and the main pane narrow, the board of topics is one list, and a topic
  shows its messages or its details, one at a time. A host that already saved its layout keeps the
  panel as it was.
- A suggestion or a card's answer button pressed in the crew panel switches the main pane to *General
  chat*, so you see the message go out. A message sent from the board of topics leaves you where you are.
- The "waiting for your answer" banner also shows while the board covers the chat. **Show** opens
  *General chat*.
- **The sidebar row's badge counts the topics that wait on you**, in the warning colour. It counted the
  working and idle workers before. There is no badge before there is a first mate.
- **The line under the title counts what you can act on**: "2 need you · 1 working · 3 queued · 4 done in
  7 days", whatever the *Columns* setting. It counted everything ever done before.
- **Done shows the newest 10 and a "Show 10 more" button**, on the board of topics and in the crew panel.
  The *Done* heading on the board of topics no longer has a count.
- On a phone, the **First mate** tab holds the same pane: the switch, the board and the chat. The other
  tabs did not change.

### Added

- **A worker's questions and permission requests in its topic.** A topic with its own agent shows what
  that agent waits on at the end of its messages, and you answer it there. The card's heading names the
  agent that asks.

### Removed

- The separate **Topics** screen, its sidebar row and **Open Topics** in ⌘K. **Open FirstMate** finds the
  screen under "topics" too.

## [0.7.0] — 2026-11-26

A screen of its own for what you and the first mate are talking about.

### Added

- **The Topics screen**, with its own row in the sidebar. The row's badge counts the topics that wait on
  you. The screen is the full width of the window and has three views:
  - **Board.** *Needs you*, *Working*, *Queued* and *Done*, side by side. A card is a title of at most
    two lines, the project and a date, and then either the question with its answer buttons (the first
    one is the first mate's recommendation) or one line of the last thing said. A dot marks words you
    have not opened. *Done* shows the 10 newest and counts the rest. On a phone the columns are one
    list, without *Done*.
  - **A topic.** One click on a card opens it: the messages on the left, each with who said it, yours
    on the right; the box that sends the next one, which says who gets it; and a panel with the status,
    project, who the topic talks to, since when, links, what it waits for with its buttons, the first
    mate's notes and the backlog id. A topic with its own agent shows what you and that agent said to
    each other, without tool calls, and **Open agent in Paseo** shows the rest. On a phone, **Details**
    swaps the messages for the panel.
  - **General chat.** The conversation with the first mate without the messages that belong to a topic.
- **Open Topics** in ⌘K.

### Changed

- An answer button pressed on the Topics screen sends its prompt under the topic's tag, so the answer is
  filed with the topic. The buttons on the FirstMate board send it as before.
- The line over a reply box now reads "Sends to the first mate, tagged [topic: <id>]" or "Sends to <the
  worker>".
- A backlog item that is ticked, or whose line says `(merged …)`, `(done …)`, `(landed …)` or `(closed …)`, counts as done
  even while it is still under *In flight*. A `(failed …)` or `(abandoned …)` line stays where it was.

### Fixed

- A `(note: …)` or `(hold: …)` whose text has parentheses of its own was left in the card's title. It is
  now read as one group, whatever it holds between balanced parentheses.

## [0.6.0] — 2026-11-26

Everything you say about one backlog item can now live on its card instead of in the one long chat.

### Added

- **Open a card.** Every card has a button: **Watch** for a card with a worker, **Open** for one without.
  A card without a worker opens beside its thread: what you and the first mate said about that item,
  kept by the plugin, so last week's messages are still there. A card with a worker keeps its live
  transcript.
- **A reply box** under the thread and under a worker's transcript. It says who gets the message: "To
  the first mate, filed under fix-flaky-login", or "To <the worker>, directly". A message to the first
  mate starts with the item's `[topic: <id>]` tag, and the first mate starts its reply with the same
  tag, so both are filed under the card. Sending from a card leaves you where you are, also on a phone.
  What you half-typed is kept until the message is delivered.
- **The last message and an unread dot on a card.** A card with no status line shows the last message
  of its thread, or what its worker last said, whichever is newer, and a dot marks a first-mate reply you have not opened yet, or a worker that wants you.
  What you have read is shared by every device you use.
- **Four columns as a setting.** *Needs you*, *Working*, *Queued* and *Done*, as an alternative to the
  seven columns, with the counts under the title following. The seven stay the default.
- **A backlog item's own worker on its card.** An item whose line names a running agent by its full id,
  `(agent: <id>)`, shows that agent on its card, and Steer and Interrupt reach it. The first mate is not told about a steer to such a worker, since it
  never dispatched it.
- **`(note: …)` on a backlog line** is read as a note on the item, as often as it is written.

### Changed

- **The chat is for general conversation.** Messages filed under a card that opens as a thread are shown
  there, not in the chat. A tagged message about an item with its own worker, or one that is gone, stays
  in the chat with its tag.
- **Cross-daemon messages are hidden in the chat by default**, and one that is shown is folded to one
  line. *Settings › FirstMate › Hide in the chat* also hides messages from other agents, Paseo and board
  notices, watch output and tool calls, each on its own.
- The charter has a new paragraph about the tag. A home that never edited its charter gets it by itself;
  an edited one gets the usual **Compare** notice.

## [0.5.0] — 2026-11-20

**Requires Paseo 0.16.** This version does not load on Paseo 0.15 or older; stay on 0.4.2 until you
update Paseo.

### Changed

- **The first mate keeps hearing about your crew after Paseo retires the old way plugins listen.**
  Relaying your steers, clearing crewmates the first mate has read about, and delivering watch
  results after its turns now use the way Paseo 0.16 expects, ahead of Paseo removing the older way
  next year. Nothing changes in how the first mate or the board behaves.

## [0.4.2] — 2026-11-20

### Fixed

- **The first mate hears about your steers again.** When you steer a crewmate from the board, the first
  mate is meant to get what you said and what the crewmate answered once that turn ends. Since Paseo
  0.13 it has not: the event the first mate listens for no longer carries the turn's messages, so no
  steer was found. The first mate now reads the turn from the crewmate's history, only while a steer is waiting.
  This also keeps the first mate working once Paseo stops sending the empty field altogether.

## [0.4.1]

- Save unsent chat text on the host so it returns after an app reload or relaunch. Typing is saved after 300 ms and flushed when the app backgrounds or the chat closes; an app killed before delivery can still lose the latest edit. Keep the draft until a send succeeds.

## [0.4.0] — 2026-10-08

### Added

- **Answer a waiting card from the board.** A card waiting on your call now shows the first mate's
  likely answers as buttons right under "Captain's call" — "Merge", "Hold", "Postgres", "SQLite" —
  and pressing one sends that answer to the first mate at once, just like a suggestion. Every waiting
  card also has an Answer box for anything else: what you type goes to the first mate with the task's
  name in front, so it knows which decision you are answering. On a phone, as with a suggestion, the
  chat comes into view to show it go out.

  The first mate writes those answers itself, so it needs its new instructions: a home whose charter
  you have not edited picks them up on its own; if you have edited yours, the board offers the new one
  to compare. A running first mate follows them once it re-reads its instructions or is restarted.

## [0.3.4] — 2026-10-07

### Fixed

- **A suggestion you remove stays removed.** Taking a suggestion off the board with its trash button
  used to last only until the first mate next updated its list, and then it came back. FirstMate now
  remembers what you removed: the board keeps it hidden, and the first mate is told not to suggest it
  again. If something about it really changes — a new pull request, new work, a new decision — the
  first mate can suggest it again in words that say what changed, and that one shows. Pressing a
  suggestion to send it does not count as removing it.

  What you removed is listed in `data/suggestions-dismissed.md` in the first mate's home, the newest
  50; open it in Files and delete a line to let that suggestion show again. A home whose charter you
  have not edited picks up the first mate's new instructions on its own; if you have edited yours, the
  board offers the new one to compare. A running first mate follows them once it re-reads its
  instructions or is restarted.

## [0.3.3] — 2026-10-07

### Changed

- **Larger, easier-to-read text.** Everything in FirstMate is a size up and now matches Paseo's own
  default text sizes: the chat, the cards, the suggestions, the watches and the files read at the
  size Paseo's own screens do, titles stay above body text and the small print stays below it.
  FirstMate does not yet follow the font sizes you choose in Paseo's Settings, because Paseo does not
  share them with plugins; it will as soon as it does.

## [0.3.2] — 2026-10-07

### Changed

- **Requires the released Paseo 0.11.0.** FirstMate was built against a Paseo 0.11 preview; it now
  follows the final release, and no longer loads on the 0.11 previews. Nothing changes in FirstMate
  itself.

## [0.3.1] — 2026-10-04

### Added

- **Read a whole suggestion before sending it.** A suggestion too long for its card now has a chevron
  beside the trash. Press it to open the full request below the card, wrapped and ready to select and
  copy; press it again to fold it. Opening a card never sends it, and pressing the card itself sends it
  as before. It works with the keyboard and on a phone.

## [0.3.0] — 2026-10-01

**Requires Paseo 0.11.** This version does not load on Paseo 0.10 or older; stay on 0.2.1 until you
update Paseo.

### Added

- **The FirstMate row in the sidebar counts your crew.** A small number beside it says how many workers
  are working or idle right now, and it goes away when there are none.

### Changed

- **The FirstMate page is titled "FirstMate".** Opened from the Command Center, `/bearings` or `/ahoy`,
  its title read "fleet"; only the sidebar row said FirstMate. Your sidebar order, a hidden FirstMate
  row and saved links to it all carry over.
- Settings › Sidebar now shows a generic plugin icon for FirstMate instead of the ship, and the page's
  title no longer has the ship beside it. Paseo draws both that way for every plugin on its new sidebar.

## [0.2.1] — 2026-09-26

### Removed

- **The chat no longer has an "Open in Paseo" button next to "Ahoy".** The first mate can still be
  opened in Paseo from the button at the top of the panel.

## [0.2.0] — 2026-09-26

### Added

- **The first mate hears about your pull requests within minutes.** When a pull request on its backlog
  is merged or closed on GitHub, gets a review or a comment from someone else, or its checks go red or
  green, the first mate is now told within about five minutes, instead of at its next half-hourly check
  or when you mention it. That covers pull requests to other people's projects too, so a maintainer's
  review reaches the worker without you passing it on. Everything that changed since the last check
  arrives together, as one short list with a link to each pull request. It needs the `gh` command,
  logged in.

  This is the first of FirstMate's **watches**: small scripts in a `watches/` folder in the first mate's
  home that run on a schedule while Paseo is running. Everything a run prints — up to 16,000 characters —
  reaches the first mate as one message, shown in the chat as one line naming the watches, and saying
  nothing costs nothing. What piles up while the first mate is busy arrives together, up to 32,000
  characters; past that the oldest are left out, and the card shows which. You can add your own — a README
  in the folder explains how — or ask the first mate to write one for you — it asks for your approval
  first, and knows how to build and try one. FirstMate adds nothing to what a watch prints, so a watch can
  tell the first mate what to do about what it finds, and since you approved it, the first mate takes that
  as your instruction. A watch that passes on text from someone else, such as a pull request comment,
  marks it as quoted, and the first mate treats that as news, not orders; the pull request watch does this
  itself. A new **Watches** card, after the board's columns (at the bottom of the Crew tab on a phone),
  lists each one with when it last ran and what it last said, and switches any of them off or on. Press a
  watch's name to open its script in the Files view. The card appears only when there are watches.

- **Suggested next steps, one press away.** When the first mate reports something you will probably
  act on — a pull request ready to land, a review to run, a decision to make — it now also offers it as
  a button. On a wide screen the buttons sit in a Suggestions card before the board's columns; on a
  phone they have a tab of their own, right after First mate. Pressing one sends that request to the
  first mate straight away, as if you had typed it and pressed Send, and shows you the chat; whatever
  you were typing is left in the message box. The card and the tab appear only when there is something
  to suggest. The first mate keeps the list in `data/suggestions.md` in its home, which you can edit too.
  A suggestion you do not want goes with the trash button beside it, which takes it off the list without
  sending anything; the rest of the list stays as it was.

- **Images and files can go with a message to the first mate.** The chat has an attach button beside
  the message box, and you can also paste a screenshot or drop files onto the chat. What you attach
  shows above the box, where you can remove it before sending, and it stays there if Paseo loses its
  connection while you are still writing. The first mate sees images as images, and gets other files
  the same way it would from Paseo's own message box. This works in the Mac app and in a browser,
  phone browsers included; in the iPhone and Android apps the button does not appear yet, because
  Paseo does not let plugins open the photo library or the file picker there.
- **Files the first mate mentions are links.** When a reply in the chat names a file in the first
  mate's home — `data/backlog.md`, `AGENTS.md`, a watch script, or the file's full path — it is a link
  that opens the file in the Files view: beside the chat on a wide window, in the Files tab on a phone.
  Only files that are really there are linked; anything outside the home, or not written yet, stays
  plain text.

### Changed

- **Removing the plugin no longer deletes the first mate's files.** Its settings, and its home when you
  have not chosen one, used to sit inside the folder Paseo installs the plugin into, which Paseo deletes
  when you remove the plugin. They now live in `~/.paseo/plugin-data/firstmate/`, and the plugin moves
  them there the first time it starts. A home you picked yourself stays where it is. The old home also
  stays put, and is still used, while a first mate is aboard in it — it moves on the first start after
  you release it — or while it holds projects the first mate cloned for you, because Paseo knows those
  by their location; the plugin's log says which. Once the home has moved, the project Paseo still lists
  for its old location can be removed.

- **The board hides columns with nobody in them.** Only the columns that have workers show, and on a
  wide screen they fill the space: up to three sit side by side, and more than three take two rows, with
  the extra one in the second row. On a phone the list simply skips the empty ones. When there is no crew
  at all, the board says so. The arrows that move a column skip over hidden ones, and a hidden column
  comes back in the place you gave it.
- **A worker that has finished waits in Idle, not Done.** When a worker reports it is done, its card now
  moves to the Idle column until the first mate lands the work and records it as done; only then does it
  reach Done. The card still shows what the worker said and anything waiting on your call. Before, a
  finished worker's card sat in Done beside work that had really landed, even while it was still waiting
  on a review or on you.
- **The first mate's instructions close a few gaps that let work stall or land badly.**
  - A worker no longer stops on "still working": it keeps going until it is done or really waiting on
    something, and one that stops anyway is nudged to carry on.
  - Before merging a pull request — even under a standing order such as merging green dependency
    updates — the first mate checks it again: it will not merge while a required check is still running,
    missing or failing, or when the pull request has changed since it showed it to you — then it shows
    you the new version instead — and it confirms the merge went through. It notes the pull request's
    address on the work, and which version it showed you, so it can tell.
  - Its regular check-in now looks at every pull request it is tracking. One you merge on GitHub is
    cleaned up and the work waiting on it starts; one you close without merging still holds work that
    never landed, so it asks you what to do with it rather than throwing it away. It also notices a worker
    that has stopped making progress in the middle of a task.
  - Each worker starts from the latest version of the project rather than a local copy that may be days
    behind.
  - It picks how hard each worker thinks for its task: less for clear, well-understood work, more for
    investigation or design, and never the maximum unless you ask for it.

  A home whose charter you have not edited picks this up on its own; if you have edited yours, the board
  offers the new one to compare.

### Fixed

- **Saving a file in the Files view keeps its permissions.** A script you could run — a watch, say —
  used to lose that after an edit and save, so the Watches card called it "not executable". It now stays
  as it was; a new file is created as before.
- **Changing a FirstMate setting no longer lets go of the first mate.** Saving one setting — the crew's
  model, say — quietly reset the others, including which agent is the first mate and where its home is,
  so the board could lose track of a first mate that was still running. A save now changes only the
  setting you changed.
- **A message you were typing to the first mate is still there when you come back.** Leaving Paseo for
  another app, putting the phone down, or letting the Mac sleep could clear the box, so a half-written
  message was gone by the time you returned. It now stays until you send it, for as long as Paseo is
  open.
- **Finished workers no longer pile up in Paseo's "Ready to review".** Every worker the first mate ran
  stayed in that part of Paseo's sidebar after it finished, as if you still had to look at it, even
  though the first mate had already read what it said. Once the first mate has read that a worker
  finished, the worker now moves to the Done section of Paseo's sidebar, as it would if you had opened
  it yourself. A worker that needs your permission or has failed still shows up for you as before, and
  your own agents are never touched.

## [0.1.1] — 2026-09-23

### Added

- **Your own first words to the first mate.** What a new first mate is told when you launch or restart
  it is now a file in its home, `data/opening.md`, beside your standing orders — change the wording,
  the language, or what it should do first. It starts as the message FirstMate has always sent, and
  your version is never overwritten.
- **The first mate's charter is yours to edit.** The instructions it works by now come from a file in its
  home, beside your standing orders. Leave it alone and it keeps up with FirstMate's own; change it and
  your version is kept. When FirstMate's charter changes after you have edited yours, the board tells you
  and opens the new one for you to compare, so you can bring over what you want.

### Changed

- **A clearer sign of work under way.** The Working column now shows a hammer, and steps still running in
  the chat and in Watch show a spinner that actually turns — the old sign was a spinner drawn standing
  still, which looked stuck.

### Fixed

- **Task titles on the board stay as you asked for them.** While finished work waited for your go-ahead,
  the first mate wrote its status into the title ("…, ready in branch …, awaiting approval to land"), and
  the card grew with it. The title now stays put, and what the first mate needs from you shows on the
  card as your call.
- **A card you opened closes again when its work moves on.** A worker finishing or starting again used to
  carry its card into the new column still open, with its buttons showing. Now it arrives closed — unless
  you were in the middle of something in it, like a message half-typed to the worker, which is kept.

## [0.1.0] — 2026-09-22

### Added

- **A first mate that runs a crew of agents for you.** Launch it from the new FirstMate panel in the
  sidebar and tell it what you need; it hands each task to a worker agent in its own git worktree,
  supervises it to the end, and brings you pull requests, findings, and only the decisions that are
  yours. Workers are ordinary Paseo agents you can open and read like any other.
- **A board of the crew** beside the conversation: queued, working, blocked, parked, done, failed and
  idle, with each worker's last word and its pull request. Steer a worker, interrupt it, end it, or
  have the first mate relaunch it, from its card.
- **`/fm`, `/bearings` and `/ahoy`** in any composer: talk to the first mate from anywhere, get a
  four-part catch-up on where everything stands, or a recap of what happened with every open decision.
- **See how full the first mate's memory is, and do something about it.** A meter beside the chat
  shows how much of its context window is used, as Paseo's own chat does. Compact it to free room, or
  restart it from scratch with the same settings; its records carry over, and the old conversation stays
  in Paseo's history.
- **Watch a worker without leaving FirstMate.** A worker's card opens beside its live activity — its
  brief, reasoning, every command and file edit with what came back, its plan and its replies — in
  place of the board, with the chat still beside it. Answer its questions and permissions right there.
- **A FirstMate tab** beside a worker's workspace and session, showing its card.
- **Answer the first mate's questions in the panel.** When it asks you to choose, or needs your
  permission or a plan approved, the question appears in the chat and you answer it there, without
  opening the first mate itself.
- **The first mate's files, in the panel.** Browse its home, read any file — its instructions, your
  standing orders, the backlog, each worker's brief and report — and edit and save it there. If the
  first mate changed a file while you were editing it, you choose which version to keep.
- **The first mate's home is easy to spot in Paseo's sidebar**: it is called FirstMate, with a ship
  for its icon, rather than "home" under a folder. A name or icon you give it yourself is kept.
- **Opening the panel marks the first mate as seen**, so its workspace in the sidebar reads as done
  rather than waiting for you, just as if you had opened the first mate itself.
- **Standing orders you write yourself**, in the first mate's home, which it reads every session and
  follows ahead of its own charter.
