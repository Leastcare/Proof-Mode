# ProofMode — UI / Art Direction Specification
## Translating the Gemini Video Analysis into the ProofMode Product

---

## 1. PURPOSE OF THIS DOCUMENT

This document explains exactly what we want the **ProofMode UI/UX** to feel and look like.

It is intended to be given to **Kiro / an AI coding agent / a frontend designer** as a high-level visual and interaction specification.

The goal is **NOT** to copy the website shown in the reference video.

The goal is to reproduce the **same level of visual sophistication, intentionality, editorial composition, restraint, cinematic quality, typography, and motion**, while creating an entirely original visual identity for **ProofMode**.

ProofMode is a product about:

- AI-generated data transformations
- verification
- evidence
- machine-checkable contracts
- reconciliation
- record lineage
- unexplained changes
- proof
- repair and re-verification

Therefore, the visual language must come from those concepts.

The final product should feel like:

> **A premium editorial / forensic verification experience for proving what AI actually did.**

It should NOT feel like:

> another generic AI SaaS dashboard.

---

# 2. THE MOST IMPORTANT DISTINCTION

The reference video has an "Editorial Tech / Cinematic SaaS" visual philosophy.

We want to borrow the **design principles**, NOT the literal visual assets.

### We DO want:

- cinematic dark canvas
- extreme typography
- sophisticated serif + sans-serif pairing
- massive headlines
- strong negative space
- rich textures
- carefully controlled imagery
- editorial composition
- minimal navigation
- restrained UI
- dramatic visual hierarchy
- deliberate motion
- hard transitions where appropriate
- visual storytelling
- asymmetric or unexpected composition when it improves the experience
- premium art direction
- strong use of silence/empty space
- interfaces that feel designed rather than assembled

### We DO NOT want:

- a generic SaaS dashboard
- sidebar + cards + charts
- dashboard grids everywhere
- excessive glassmorphism
- floating gradient blobs
- purple AI gradients
- generic glowing neon AI interfaces
- dozens of rounded cards
- excessive green/red status pills
- generic tables occupying the entire screen
- stock "AI" illustrations
- meaningless 3D holograms
- standard chatbot layouts
- a conventional admin panel
- an interface that looks like it was generated from a UI component library

---

# 3. WHAT THE REFERENCE VIDEO ACTUALLY TELLS US

The Gemini analysis identified the reference as an **Editorial Tech / Cinematic SaaS** experience.

Its key qualities are:

### Cinematic canvas

The background is almost black.

The darkness creates room for:

- typography
- photography
- texture
- contrast
- visual tension

The design does not try to fill every empty pixel.

### Editorial typography

The primary headline uses a sophisticated, high-contrast serif.

Functional text uses a clean geometric sans-serif.

The contrast between these two typefaces creates much of the identity.

The headline can use:

- italicized words
- dramatic scale
- unusual line breaks
- deliberate spacing

Typography itself becomes part of the visual composition.

### Extreme scale contrast

The main headline is dramatically larger than supporting copy.

For example:

- enormous H1
- small contextual label
- restrained body copy
- tiny utility text

This creates hierarchy without needing lots of UI decoration.

### Minimal navigation

Navigation stays peripheral.

It should never compete with the main visual composition.

The reference uses:

- minimal left navigation
- minimal right action
- centered visual identity

ProofMode should follow the same restraint.

### Color restraint

The UI itself remains largely monochromatic.

Vibrant colors come from the **content/art direction**, not from every button.

ProofMode should similarly use:

- black
- near-black
- off-white
- warm gray
- muted gray

with very limited semantic colors.

---

# 4. PROOFMODE'S OWN VISUAL CONCEPT

## Editorial Forensics

This is the visual identity we should create for ProofMode.

ProofMode should feel like a combination of:

- investigative publication
- forensic evidence room
- data laboratory
- archival document
- premium technology product
- analytical instrument

The interface should visually communicate:

> **"We are not telling you that the AI succeeded. We are showing you the evidence."**

That idea should influence every screen.

---

# 5. PROOFMODE'S VISUAL METAPHORS

Instead of using flowers, fashion photography, or generic futuristic graphics, ProofMode should use concepts connected to verification.

### Primary visual metaphors

#### 1. Evidence

Individual records become pieces of evidence.

#### 2. Documents

CSV files feel like digital documents rather than generic file cards.

#### 3. Annotations

Important parts of data can be highlighted with editorial-style annotations.

#### 4. Reconciliation

Two datasets visually converge, diverge, and reconcile.

#### 5. Lineage

Lines can subtly connect an original record to its transformed state.

#### 6. Absence

Missing records should be represented by empty spaces / gaps rather than just red icons.

#### 7. Proof

Successful verification should visually settle the composition.

#### 8. Archive

Subtle paper, scan, grain, typography, and archival textures can create depth.

---

# 6. COLOR SYSTEM

The base should be extremely restrained.

### Base

```text
Deep Black       #080808
Near Black       #0D0D0C
Charcoal        #151515
Warm Charcoal   #20201D
```

### Typography

```text
Primary White   #F4F1EA
Soft White     #DDD9D0
Muted Gray     #8B8983
Dark Gray      #55534E
```

### Semantic accents

Use sparingly.

```text
Verified        muted cool/green tone
Attention       restrained amber
Failed          restrained red
```

Important:

Do NOT make every status element brightly green or red.

Semantic colors should feel like **annotations on an editorial page**, not dashboard traffic lights.

---

# 7. TYPOGRAPHY

Typography is one of the most important parts of the entire design.

## Display type

Use a premium high-contrast serif.

Possible direction:

- Cormorant Garamond
- Instrument Serif
- Playfair Display
- DM Serif Display
- another sophisticated editorial serif

Do not make it look old-fashioned.

It should feel contemporary and luxurious.

## Functional type

Use a clean modern sans-serif.

Possible:

- Inter
- Geist
- Manrope
- Satoshi
- IBM Plex Sans

## Data / technical type

Use a restrained monospace for:

- IDs
- filenames
- values
- evidence
- hashes
- technical metadata

Possible:

- IBM Plex Mono
- Geist Mono
- JetBrains Mono

### Typography hierarchy

Use scale instead of lots of font weights.

Example:

```text
MICRO LABEL
12px / uppercase / letter spacing

HEADLINE
80–140px editorial serif

SUBHEAD
18–22px clean sans

BODY
15–17px sans

DATA
13–15px monospace
```

Exact sizes can respond to viewport.

---

# 8. LANDING / ENTRY EXPERIENCE

The first screen should immediately establish the product's identity.

Do NOT begin with a dashboard.

Do NOT immediately show a sidebar.

Do NOT show 10 cards.

Instead, create a cinematic introduction.

### Hero concept

Large central headline:

> **Did it actually**
> ***do what you asked?***

The word "you" or another important word can be italicized.

Above it:

```text
AI OUTPUT VERIFICATION · 01
```

Supporting text:

> ProofMode turns AI-performed data transformations into machine-checkable proof.

Then a restrained CTA:

> Start a verification →

Secondary:

> See how it works

The background can contain extremely subtle data/document textures.

---

# 9. THE DATA SHOULD BE THE ART

This is critical.

We should not decorate the application with random abstract graphics.

The actual product data should become the visual material.

For example:

Thousands of tiny rows can form a subtle field.

A CSV document can appear as a large editorial object.

Individual customer IDs can move through the interface.

A reconciliation line can physically connect an original record to its output.

Missing records can leave visible gaps.

This makes the product visually unique.

---

# 10. CORE USER FLOW

ProofMode should feel like one continuous visual narrative.

The core sequence is:

```text
QUESTION
   ↓
CONTRACT
   ↓
TRANSFORMATION
   ↓
RECONCILIATION
   ↓
EVIDENCE
   ↓
REPAIR
   ↓
RE-VERIFICATION
   ↓
PROOF
```

Do not treat these as boring separate dashboard pages.

The interface should transition between them.

---

# 11. STEP 01 — QUESTION

The user enters:

> Clean this customer dataset. Remove duplicates. Normalize phone numbers. Preserve every unique customer. Don't modify email addresses.

Instead of showing this inside a standard textarea card, make the instruction itself a major visual object.

The sentence should occupy the screen with editorial typography.

Important phrases can be subtly highlighted.

For example:

> Clean this customer dataset.
>
> **Remove duplicates.**
>
> **Normalize phone numbers.**
>
> **Preserve every unique customer.**
>
> **Don't modify email addresses.**

The interface should communicate that this sentence is about to become a formal contract.

CTA:

> Build the proof →

---

# 12. STEP 02 — CONTRACT

The AI compiler translates the instruction into a constrained contract.

The UI should NOT look like a JSON editor.

Instead, present the contract as an editorially designed proof sheet.

For example:

```text
WHAT WE WILL PROVE

01
PRESERVE ENTITY
Every unique customer_id must remain.

02
DEDUPE
Duplicate customer records may be removed.

03
NORMALIZE
Phone numbers must use digits-only format.

04
UNCHANGED COLUMN
Email addresses must remain unchanged.

05
NO NEW ENTITY
No customer_id may appear that was not present before.
```

The user can approve or edit it.

The important concept:

> **AI proposes the contract. You approve it. Code verifies it.**

This should be visually prominent.

---

# 13. STEP 03 — TRANSFORMATION

The user provides:

```text
customers_before.csv
customers_after.csv
```

The files should not simply appear as two rounded cards.

They should feel like two large digital documents.

Example:

```text
CUSTOMERS / ORIGINAL
10,000 RECORDS
24 COLUMNS
```

and

```text
CUSTOMERS / TRANSFORMED
9,863 RECORDS
24 COLUMNS
```

Between them:

```text
AI TRANSFORMATION
```

Subtle lines can connect records between the two datasets.

This is where the concept of **lineage** appears.

---

# 14. STEP 04 — RECONCILIATION

This should be one of the most visually dramatic moments.

Do not immediately show a dashboard.

The screen begins with:

```text
10,000
records
```

Then transitions:

```text
10,000 → 9,863
```

The number is enormous.

Then the transformation is explained:

```text
94
legitimate duplicate removals
```

and:

```text
43
unexplained losses
```

The 43 should visually separate from the dataset.

They can appear as individual evidence fragments.

The important statement:

> **43 records have no valid fate.**

This should be a major editorial moment.

---

# 15. WHY "NO VALID FATE" MATTERS

This phrase is part of the product's emotional identity.

Instead of:

> ERROR: 43 RECORDS MISSING

Use:

> **43 records have no valid fate.**

This sounds investigative rather than technical.

It communicates that the system is following the lifecycle of every record.

This is a key differentiator.

---

# 16. STEP 05 — EVIDENCE

When the user investigates a missing record, the interface should become extremely focused.

Do not open a generic modal.

Instead, transition into an evidence composition.

Example:

```text
CUS-01842
```

Large.

Then:

```text
ORIGINAL
────────────────────────
Customer ID   CUS-01842
Name          Priya Sharma
Email         priya@example.com
Phone         +91-9876...
```

Then:

```text
TRANSFORMED
────────────────────────
NOT FOUND
```

Then annotations:

```text
PRESENT IN ORIGINAL
ABSENT IN OUTPUT
NOT A DUPLICATE
NOT PERMITTED BY CONTRACT
```

Final state:

> **UNEXPLAINED LOSS**

The screen should feel like a forensic report.

---

# 17. STEP 06 — REPAIR

After discovering a problem, ProofMode should not pretend to automatically fix the dataset.

Instead:

> Generate a repair instruction →

The generated instruction might be:

```text
Restore the 43 missing customer records.

Do not modify any other records.

Preserve the approved transformations.

Verify that every unique customer_id from
the original dataset exists in the corrected output.
```

This should look like a carefully composed document.

The user can copy it into their AI tool.

---

# 18. STEP 07 — RE-VERIFICATION

The corrected CSV is uploaded.

The same verification process runs again.

The interface should visually return to the reconciliation state.

Then:

```text
8 / 8
VERIFIED
```

or:

```text
ALL REQUIRED CHECKS PASSED
```

The final screen should feel calm.

The visual noise disappears.

The composition settles.

This is important:

### Failure should feel unresolved.

### Verification should feel resolved.

Motion itself communicates the state.

---

# 19. MOTION DESIGN

Motion is essential.

The reference video's sophistication partly comes from transitions and pacing.

ProofMode should use motion to explain concepts.

### Motion principles

- smooth but restrained
- no unnecessary bounce
- no excessive spring animations
- no generic "AI sparkle"
- no constant floating objects
- no animation for decoration alone

Every animation should communicate a change in state.

### Examples

#### Instruction → Contract

Words transform into contract clauses.

#### Original → Output

Records flow from one dataset into another.

#### Missing records

Rows disappear and leave gaps.

#### Evidence

A specific record separates from the larger dataset.

#### Repair

The unresolved evidence reorganizes into a repair instruction.

#### Verification

The composition settles and becomes visually quiet.

---

# 20. TRANSITION LANGUAGE

Use cinematic transitions.

Possible techniques:

- hard editorial cuts
- slow fades
- masked reveals
- document sliding
- typography morphing
- line tracing
- data flowing
- large number transitions
- subtle camera movement
- controlled zoom

Do not over-animate everything.

A strong transition followed by stillness is better than constant motion.

---

# 21. NAVIGATION

The product should NOT start with a permanent dashboard sidebar.

Navigation should be minimal.

Possible top-level controls:

```text
ProofMode
New verification
Past proofs
```

Settings and utility controls can be peripheral.

The main screen should belong to the current verification.

Navigation must never visually overpower the content.

---

# 22. UI COMPONENT PHILOSOPHY

Components should look bespoke.

### Buttons

Use pill buttons sparingly.

Example:

```text
Prove it →
```

or:

```text
Continue →
```

Primary buttons should be visually quiet.

### Cards

Cards should NOT become the dominant visual language.

Only use containers when they genuinely help separate evidence.

### Borders

Use extremely subtle borders.

Avoid boxes around everything.

### Dividers

Prefer whitespace over dividers.

### Tables

Tables are necessary for evidence, but should feel editorial.

Use:

- generous row spacing
- typography hierarchy
- subtle separators
- monospace data
- minimal controls

Do not make the entire application look like an admin database.

---

# 23. IMAGERY AND TEXTURE

The reference uses photorealistic imagery.

ProofMode does not need generic photography.

Instead, use controlled visual texture.

Potential assets:

- scanned paper
- archival document edges
- macro data textures
- subtle paper grain
- dark photographic textures
- printed numerical fragments
- faint document stacks
- technical diagrams
- abstract close-ups of data surfaces

These should blend into the black background.

Never place them inside obvious rectangular image cards.

---

# 24. WHAT NOT TO DO

These are hard constraints.

### NEVER make the primary UI look like:

```text
┌ Sidebar ┐ ┌ Card ┐ ┌ Card ┐
│         │ └──────┘ └──────┘
│         │ ┌───────────────┐
│         │ │ Chart         │
│         │ └───────────────┘
```

### Avoid:

- generic dashboard layouts
- excessive cards
- standard SaaS navigation
- purple gradients
- neon cyan AI glow
- floating blobs
- glassmorphism everywhere
- generic 3D AI brain imagery
- robot illustrations
- chat UI
- giant "AI" icons
- generic green checkmarks everywhere
- standard red error banners
- generic analytics charts
- stock photography
- excessive shadows
- excessive rounded rectangles

---

# 25. THE PRODUCT SHOULD FEEL LIKE A DESIGNED OBJECT

The user should feel:

> "Someone deliberately designed every visual decision here."

Not:

> "An AI generated a dashboard."

That means the UI needs:

- intentional typography
- intentional composition
- intentional whitespace
- strong visual rhythm
- fewer components
- fewer colors
- fewer borders
- stronger transitions
- stronger visual metaphors

---

# 26. RESPONSIVE DESIGN

The experience must still work on smaller screens.

However, mobile should not simply become a compressed desktop dashboard.

The visual narrative should remain.

For mobile:

- typography remains dominant
- evidence becomes vertically staged
- datasets become focused views
- transitions remain meaningful
- controls stay minimal

---

# 27. ACCESSIBILITY

Premium visual design must not sacrifice usability.

Ensure:

- sufficient text contrast
- keyboard navigation
- clear focus states
- semantic HTML
- accessible buttons
- accessible form controls
- status information not communicated only by color
- readable data tables
- reduced-motion preference support

---

# 28. PERFORMANCE

The visual experience should remain lightweight.

Avoid unnecessarily huge background assets.

Prefer:

- CSS effects
- optimized images
- SVG
- lightweight motion
- GPU-friendly transforms
- lazy loading

Animations should not make the application feel slow.

---

# 29. TECHNICAL UI PRINCIPLE

The visual experience must sit on top of the real ProofMode verification engine.

Do NOT fake the verification.

The actual system should still follow:

> **AI proposes. Human approves. Code verifies.**

The UI is allowed to be cinematic.

The underlying verification must remain deterministic.

---

# 30. PRODUCT TRUST PRINCIPLE

The UI should reinforce:

> **If we cannot prove it, we do not say it passed.**

Possible states:

```text
VERIFIED
FAILED
CAN'T VERIFY
```

Never use an AI-generated confidence score as proof.

Never allow an LLM to directly declare a dataset correct.

The AI can compile the user's instruction into a contract.

The deterministic verifier produces the verdict.

---

# 31. THE CENTRAL BRAND IDEA

The entire product can revolve around:

> **AI did the work. We prove what happened.**

Alternative:

> **Don't trust what AI says it did. Verify what it actually did.**

This idea should be visible in the visual identity.

---

# 32. THE EXPERIENCE IN ONE SCREENPLAY

### OPEN

Black screen.

Small label:

`PROOFMODE / VERIFICATION 01`

Huge serif:

> **Did it actually**
> ***do what you asked?***

---

### INPUT

The user's instruction appears.

Words become highlighted.

---

### CONTRACT

The instruction transforms into explicit proof requirements.

> **You approve what will be proven.**

---

### TRANSFORMATION

Two datasets appear.

```text
10,000
        →
9,863
```

Records flow between them.

---

### RECONCILIATION

```text
94
explained

43
unexplained
```

Silence.

Then:

> **43 records have no valid fate.**

---

### EVIDENCE

One record fills the screen.

```text
CUS-01842
```

Original exists.

Output doesn't.

No valid explanation exists.

---

### REPAIR

A precise repair instruction is generated.

---

### RECHECK

Corrected data enters.

---

### FINAL

```text
VERIFIED
```

Everything becomes visually quiet.

---

# 33. DESIGN DNA — THE 20 RULES

1. Treat ProofMode as an editorial experience, not a dashboard.
2. Use typography as the primary visual element.
3. Use a sophisticated serif for major statements.
4. Use a modern sans-serif for functional UI.
5. Use monospace only for technical data.
6. Maintain an almost-black cinematic canvas.
7. Use extreme scale contrast.
8. Protect negative space.
9. Keep navigation peripheral.
10. Minimize UI chrome.
11. Let actual data become the visual material.
12. Use evidence and documents as visual metaphors.
13. Use animation to communicate state changes.
14. Use color sparingly and semantically.
15. Avoid card-grid layouts.
16. Avoid generic AI visual clichés.
17. Avoid excessive glassmorphism.
18. Make failure visually unresolved.
19. Make verification visually settled.
20. Every visual decision must reinforce the concept of proof.

---

# 34. FINAL CREATIVE DIRECTION

The final ProofMode product should feel like:

**A forensic editorial publication that happens to be an interactive data-verification tool.**

It should combine:

**Editorial design**
+
**Forensic evidence**
+
**Data lineage**
+
**AI transformation**
+
**Cinematic motion**
+
**Premium product design**

The reference video gives us the **quality bar**.

ProofMode provides the **visual subject matter**.

We are not copying the reference.

We are creating a new visual language from the same level of design discipline.

---

# 35. FINAL INSTRUCTION TO KIRO

When implementing this UI, do NOT interpret this specification as:

> "Make a dark SaaS dashboard with serif fonts."

That is explicitly wrong.

Interpret it as:

> "Design a completely original cinematic editorial verification experience where typography, data, evidence, whitespace, and motion form the interface."

The interface must feel authored.

Every screen should have a visual idea.

Every transition should have a purpose.

Every piece of decoration should relate to evidence, data, documents, transformation, reconciliation, or proof.

When choosing between:

**more UI components**

and

**more composition / whitespace / typography / visual storytelling**

prefer the latter.

When choosing between:

**generic SaaS convention**

and

**a bespoke interaction that makes the verification concept clearer**

prefer the bespoke interaction.

The goal is not to make ProofMode look "AI-generated."

The goal is to make it look like a **real, premium product created by a world-class digital design studio**, while remaining technically functional and trustworthy.

---

## CORE STATEMENT

# AI DID THE WORK.
# WE PROVE WHAT HAPPENED.
