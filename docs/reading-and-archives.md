# Reading and station archives

Visit the break-floor **Store room → Work documents / projects / accounting**, or **Documents & mood boards**, then choose **Station library archives**. This is the central place for your uploaded material. Upload a PDF, EPUB, MP4, image, audio recording, pattern or other file, enter a section and tags, and check every station where it should appear. One original file can belong to woodworking, jewellery and any other selected stations simultaneously. Files with no station assignment remain in the archive.

Use **Organize sections & stations** to change assignments. Unchecking a station removes the material from its shelf and retains the archive original. Station libraries show only assigned material, grouped by section. You can also upload directly at a station; that file joins the archive and that station's shelf. Open an archive again after changing assignments to refresh its list. Existing library uploads are indexed once without copying their original files. The archive shares the Documents organizer, whose file cards also offer **Assign to station libraries**.

Files are stored in your signed-in local cabinet, separate from Git repositories. The current upload limit is **512 MB per file**. MP4 videos have in-app playback and can play on supported station screens. Images and audio have in-app previews; other formats can be downloaded to their editing app. Back up the office data directory to preserve originals, assignments, annotations and notes.

## Read a book

PDFs preserve their original printed pages and selectable text. The first page is displayed as a cover; **Open book** opens two facing pages. Click a folded **lower corner** to turn pages. Previous/Next and arrow keys also work. Choose **Single page**, change zoom or enter a page number. Page-turn sound is optional and initially muted. The reader saves your position across shelves that share the same original file. EPUB and text are arranged into reading pages; their pagination is not the publisher's printed pagination.

**Mark page** keeps a page reference. Select text on one page and choose **Highlight selected passage** to save a highlight and attach a reference to the current note. A scanned PDF without selectable text needs OCR before passage highlighting; marking and citing whole pages still work. Page numbers in citations count pages of the uploaded file, including its cover.

## Notes and citations

Click **Notes sheet** to unfold a separate sheet beside the book. Enter a title, subject, note and optional extra tags. **Cite page / selection** attaches the active page or selected passage; click on a page to make it active in a facing spread. Save with **Save note to documents**. Notes appear in **Documents & mood boards**, under **Reading notes / subject**, with book, subject and date tags. They can also be downloaded as Markdown. Drafts save automatically; saving publishes the current draft into the document record. Save changes before starting a new note.

Open a document's **Open reading note & citations** button, then click a reference to reopen the original book at that page with the passage emphasized. **Saved reading notes** inside the reader lists that book's saved notes. Downloaded Markdown includes links back into this local office; keep the office running and sign into the same cabinet to use them. Original assets are retained if a shelf entry is removed. Close any reader or archive with the top-right **✕** or **Esc** to return to mouse-look.

Storage uses the existing `organizer` collection for archive metadata and the `reading` collection for positions, page marks, highlights and notes. Asset IDs connect both, so assigning a file to another shelf shares annotations without duplicating the file. Existing study-hall notes and highlights are imported on first reading.

## Capacity and growing your world

Choose **Storage & performance** in the archive. It reports original file count and size, total cabinet size including notes and working files, file types, largest originals, free disk space, server memory, available laptop RAM, current view frame rate and allocated 3D resources. **Refresh** takes a new snapshot. Originals are counted once even when assigned to multiple stations. Files removed from the organizer are retained and still count toward storage. The inventory is scoped to your signed-in cabinet; available disk and RAM are machine-wide. Browser JavaScript memory, when available, excludes much of GPU, video and PDF memory.

Cabinet totals exclude Git checkouts, installed apps and external projects. Those still consume the same laptop disk, so watch free disk space as well as the cabinet total. During an upload, temporary bytes may appear in cabinet size before the original is committed and counted.

Uploads and media downloads now stream between disk and the browser instead of loading entire originals into server RAM. At most **two uploads** run concurrently. The server reserves **2 GB of free disk space** when accepting a new upload; insufficient space produces an error rather than publishing a partial file. Failed or interrupted uploads clean up their staging files. Other programs can consume disk space during an upload, so the reserve is not a guarantee. Keep a larger everyday margin; the panel flags less than 10 GB free.

A progress banner shows bytes transferred and the upload percentage. **Finishing upload** means the server is validating and publishing the original; **Original saved** confirms the file transfer. Station assignments save immediately afterward. Transfers time out after ten minutes so a stuck upload can be retried.

PDFs request **256 KB chunks as needed** and render only the displayed pages. This avoids eagerly fetching a 140 MB dictionary into the browser. Some PDF structures still need many chunks or significant memory; opening a book is not a fixed-memory operation. Text/EPUB reading and some model/editing tools still load complete files. Large model previews retain their separate 40 MB limit. The 512 MB upload ceiling applies to stored originals, not to every tool's processing capacity.

Build in stages:

1. **Useful rooms first.** Make one floor's core activities work, then check normal on-screen performance before adding details or another floor.
2. **A shared archive.** Store one original and assign it to several stations. Avoid embedding source books, videos or CAD projects into scenery or Git repositories.
3. **Small displays, large originals.** Use compressed textures and lightweight preview models on display; keep high-resolution source art and CAD files on disk. Open one large book/video at a time.
4. **Observe before expanding.** Check frame rate while walking around, opening a tool and playing a lesson. Compare the same room and activity before and after changes. Background tabs and headless rendering are not useful graphics benchmarks.
5. **Protect your work.** Back up the office data directory and any external project folders to another drive. GitHub does not back up the cabinet. Check that you can restore a backup before making major upgrades.

There is no tested maximum number of floors or overall cabinet size. Disk capacity, browser/server RAM, graphics workload, background apps and the complexity of individual tools constrain different parts of the world. Floor worlds may retain cached 3D resources after you leave; the allocated-resource count helps reveal that growth. Metadata collections currently have a 2 MB JSON save limit, and the shared reading notebook limits serialized data to 1.8 million characters. Those structures will need partitioning before a very large archive or annotation collection can scale indefinitely. Future steps should focus on unloading unused floors, paging archive metadata, external media folders and reliable backup/restore rather than just increasing limits.
