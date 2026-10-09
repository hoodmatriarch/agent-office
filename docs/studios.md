# Creative studio and craft workshop

Two native elevator floors sit alongside the break floor, classroom, project offices and rooftop. No repositories are needed. Press **E** at a station or use **Studio tools**. **Pip (F2)** explains studio tools. Close panels with top-right **✕** or **Esc** to return to mouse-look.

## Music

Enable the digital piano and play **A W S E D F T G Y H U J K O L P ;** (C4 upward), or click its keys. Upload WAV/MP3/OGG/M4A samples; set their original root note (60 = middle C). Samples change pitch as you play. Volume starts at 35%.

**Record new performance**, play, then **Stop & save**. **Export & save WAV** renders the actual sampled/synthesized sound and saves playable audio on your shelf. **Export MIDI** preserves editable notes for FL Studio. The 16-step sketchpad can also become recorded notes. Microphone recording requests browser permission and saves WebM vocals. JSON exports preserve notes, tempo, sequence and file references.

**Open FL Studio** launches the installed Windows app. **Send WAV recording to FL Studio** hands it your recording; import/drag it into the playlist or sampler as appropriate. Upload/open FLP projects too. FL Studio is not embedded. Direct real-time MIDI routing needs a virtual MIDI port; the office can select available MIDI outputs, but does not install a driver. BandLab and SUNO open online: upload exported WAV there and bring downloaded audio back into samples. Their accounts are not automatically synchronized.

## Art and writing

Editable sketch strokes save and stay on the station screen. Save finished PNGs to the shelf, put them in named sketchbooks, flip pages and hang images on the wall display. Multiple mood boards keep separate image cards; Previous/Next switches boards, and Move earlier rearranges cards.

Generate/augment images with the optional OpenAI API connection, or open ChatGPT and upload its result. **Open in Paint** makes a desktop handoff copy. Save to that same file, then **Import saved Paint edits** adds a new version to your shelf.

The stained-paper typewriter saves writing, exports TXT and copies drafts into the digital journal. Journal entries hold text, images, collages and file attachments. Writing-library links include dictionaries and the author’s *The Artist’s Way* site; upload your own books. Copyrighted books are not bundled.

## Crafts and Blender

Textiles, jewellery/silversmithing, sculpture, woodwork and leather have separate project and learning shelves. Upload concept sketches, patterns, Blender files, GLB/STL models, STEP files and other work. STEP is stored/downloaded; preview supports GLB/STL.

Enter millimetre dimensions for hollow boxes, rings or tapered vases. **Assemblies** contain up to 48 boxes, cylinders, spheres or cones, including subtractive cuts. ChatGPT/OpenAI or Claude interprets prompts and concept images into this measured recipe. Review it, then **Build in Blender**. Follow-up prompts include the current design. You can also copy the supplied prompt into a browser assistant and import its recipe JSON. Edit recipe JSON for manual adjustments.

Blender executes a fixed modelling script against validated data; generated Python never executes. Saved results:

- `.blend`: manually editable Blender project; uploads open with Python auto-execution disabled.
- `.glb`: geometry/materials for the office display, in metres.
- `.stl`: mesh coordinates in millimetres for common slicers.
- `.scad`: measured, editable constructive-solid CAD source for OpenSCAD.
- `prototype-recipe.json`: recipe for future revisions.

Previews scale to fit; exported measurements stay intact. Meshes and OpenSCAD source are not STEP/B-rep exports. Check fit, tolerances, material and manufacturing details before production. Primitive assemblies are supported, not unrestricted image-to-3D reconstruction. Textiles/leather also make rectangular SVG templates with seam allowance: print at **100%** and check with a ruler.

## Connections

Open **Studio tools → Studio connections**. Enter your API keys in the local password fields, not in chat. Keys are encrypted with AES-GCM in your personal vault using the server secret; browsers receive only configured/not-configured status. Preserve the office secret when backing up data. App/API control is restricted to authenticated local owner/admin sessions. Environment variables `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OFFICE_OPENAI_MODEL` and `OFFICE_CLAUDE_MODEL` also work. Design model names can be edited in the panel.

Website subscriptions and API billing are separate. Only pressing an AI creation button sends your entered prompt and selected image. Images use OpenAI Images (`gpt-image-2.5-sunburst`, 1024 square, low quality). Design uses OpenAI Responses/Anthropic Messages. No paid API calls occur on floor entry. BandLab/SUNO use web links and manual audio exchange.

Local launch buttons detect FL Studio 21, Blender 5.2/4.2 and Windows Paint at standard locations. Only supported files from your own vault can be handed to an app; arbitrary commands and computer paths are disallowed. Native apps open in their own windows.

References: [OpenAI images](https://developers.openai.com/api/docs/guides/image-generation), [OpenAI Responses](https://developers.openai.com/api/reference/resources/responses/methods/create), [Claude vision](https://platform.claude.com/docs/en/build-with-claude/vision), [FL Studio manual](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/).

## Libraries and storage

Each station holds PDF/EPUB/TXT/Markdown books and MP4 lessons. Watch with play/pause/seek, or **Play on station screen** while you create. Floating controls pause, adjust volume (starts at 30%) or stop. Floor travel stops playback. Break/classroom libraries also accept MP4.

Creative state, uploads, handoffs and prototypes live under `facilities/<owner hash>` in office data, outside GitHub. Shared-password sessions share a vault; accounts have separate vaults. Each upload may be up to 80 MB; displayed models are limited to 40 MB. GLB must be self-contained. Download important files and back up office data. Revision checks detect other-window saves.
