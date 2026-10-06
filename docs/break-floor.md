# The shared break floor

Open **Break floor** on screen, or select **The break floor** in the elevator. It is a shared facility available without a GitHub project. It opens a separate walkable 3D facility view while project workers continue running. Every visitor has their own navigation view; this first version does not synchronize occupants or kitchen shifts between visitors.

The overview shows the kitchen, dining tables, window lounge and library, men's and women's bathrooms, storeroom, lockers, vending machine and drawing/document corner. Choose a destination to walk around furniture to it, or walk with WASD/arrow keys and drag to look. Press E nearby or click Use. Close with the top-right X or Escape to return to your project. Movement keys stand up from a seat.

## Food and kitchen shifts

Mae is the cashier/barista and Gus the chef. Order coffee, burgers, hotdogs, soft drinks, cabinet sandwiches and fresh cooked meals. Collect ready orders, take a seat and eat from your tray. Food is virtual and preparation uses short timers. The vending machine serves drinks and sandwiches. The menu is defined in `src/client/games/kitchen/engine.ts` for future expansion.

The volunteer station runs **Breakroom Rush**, an original two-minute time-management game. As barista, brew coffee, serve ready food, send hot-food tickets to the chef, deliver plates and collect coins. As chef, manage three cooking stations, turn food halfway through and plate before it burns; Mae handles service. Customer patience determines tips, lost customers leave and wasted food costs $2. Reach the daily goal to advance to a harder shift. Pause, choose another role, or leave at any time. Hurry up prompts humorous replies. Optional banter speech uses browser voices; it starts off. The game uses no coding-agent calls.

The same independent game modules have a standalone entry at `/kitchen.html`. They have no dependency on office workers, GitHub, documents or credentials. The exported standalone project can be developed into an installable Steam game later; no Steam release or payment is performed by this feature.

## Books and art

The library uploads PDF, EPUB, TXT and Markdown files up to 80 MB. Pick **Take book to couch** to sit in the window lounge and read. PDF retains original pages; EPUB displays the book's text in reflowed pages, without its original illustrations or layout. Click page edges, Previous/Next, or arrow keys to turn pages; Go selects a page. Closing saves your bookmark. Download original preserves access to the full uploaded file. DRM-protected EPUB/PDF books are not supported.

The built-in drawing desk has brush, eraser, line, rectangle, ellipse and text, colors, width, undo and redo. Editable strokes save automatically and the drawing stays visible on the desk. **Download PNG** exports to your laptop. **Save PNG to art shelf** makes an image copy before starting a new blank canvas. Save failures are shown; retry or download before closing when a save fails. Simultaneous edits in another tab are rejected rather than silently overwriting them. This canvas is persistent rather than a live collaborative whiteboard.

## Documents, staff and storage

The organizer uploads local files or bookmarks HTTPS links to Google Docs, Sheets, Canva and other apps. Add names, folders, tags and notes, search, edit details, display images as a mood board, view PDFs or download originals. App buttons open their existing editors. Account syncing and embedded third-party editors are not implemented; links do not give the office access to your accounts.

Employee files hold names, roles, personal notes, reviews, complaints and attachments. Work documents, projects and accounting files use the organizer. Supplies have editable stock levels. Lockers save coats/items lists and personal uploads. June performs cleaning rounds (bins, tables, dishes, mopping, bathrooms and golf clubs); Leon performs maintenance rounds (lights, wiring, chairs, vending machine and supplies). Their animated routines are ambient simulation, not a real maintenance/inventory automation.

Files and collections are stored under the running office's `.agent-office/facilities/<hashed-sign-in>/`, outside project repositories. An individual account gets its own cabinet; shared-password sessions share one cabinet. They survive browser and server restarts. Back up this directory separately. These records are not a secured HR/accounting system: coding workers run as the same OS user and may read local data. The HTTP routes require an office session, check the origin for writes, keep file paths inside the vault and reject stale saves.

Pip's **Ask Pip** question box finds answers in the built-in reference, with suggested topics and an honest unknown-answer fallback. **Teach me GitHub** introduces repositories, saves/commits/pushes, branches/worktrees, reviewing workers and publishing. F2 and Ask Pip also work inside the break-floor view. Pip uses no AI allowance and cannot inspect project files or infer arbitrary questions beyond his reference topics.
