# Assignment 5 – Non-functional Testing  
**Lab:** Lab 2  
**Team members:** Adam | Daniel  
**Work distribution:** We both sat down in an in-person session to research, share knowledge and discuss what quality means in software products which seems to be a very broad topic. We then wrote this text.

---

## 1 Qualities

### 1.1 Why a quality must be explicitly defined before testing  
Testing is fundamentally about comparing **actual** behavior or measurements against a **precise expectation**. Without an explicit, shared definition of what “accessible,” “maintainable,” or “safe” means, you cannot:

- **Decide what tests to write** (because you don’t know what you’re measuring).
- **Choose pass/fail criteria** (because the target is vague).
- **Communicate results unambiguously** (because stakeholders might each have different mental models).

Thus, defining each quality in measurable terms is the **prerequisite** to any valid test design or evaluation.

### 1.2 Accessibility  
- **Definition**  
  Conformance to **WCAG 2.1 Level AA**: web content must be perceivable, operable, understandable, and robust for people with a wide range of disabilities.  
- **Test technique**  
  1. **Automated audit**: run [axe-core](https://github.com/dequelabs/axe-core) against every React page.  
  2. **Manual checks**: verify keyboard-only navigation and focus order; test with a screen reader (NVDA or VoiceOver).  
  3. **Contrast measurement**: use Chrome DevTools or the WebAIM Contrast Checker for text/background ratios.

### 1.3 Maintainability  
- **Definition**  
  As per **ISO/IEC 25010** “the ease with which a software product can be modified to correct faults, improve performance, or adapt to a changed environment.”  
- **Test technique**  
  1. **Static code analysis**: integrate SonarQube (or ESLint with complexity rules) to report cyclomatic complexity, code-duplication, and module coupling.  
  2. **Metric thresholds**: enforce “no function > 20 cyclomatic complexity” and “no duplicated blocks > 5 lines.”  
  3. **Code review checklist**: ensure modules adhere to Single Responsibility Principle and have inline documentation.

### 1.4 Safety  
- **Definition**  
  Per **ISO/IEC TS 17904** “the software’s freedom from unacceptable risk of physical injury or damage to the health of people, either directly or indirectly.”  
- **Test technique**  
  1. **Static hazard analysis** (FMEA): review controllers’ error-handling paths (e.g., `TaskController.create` in `taskcontroller.py`) for unhandled exceptions.  
  2. **Fault-injection**: simulate invalid inputs (e.g., malformed URLs) and verify the system fails gracefully without data corruption.  
  3. **Threat modeling**: map data flows (e.g., user→task→video controllers) and identify any operations that could lead to unsafe states.

---

## 2 Static Testing

### 2.1 Static vs. Dynamic Test Techniques  
- **Static testing** examines **artifacts** (source code, design docs, schemas) **without executing** the system. Examples: code reviews, linting, schema validation, metrics collection.  
- **Dynamic testing** exercises the running software (unit tests, integration tests, end-to-end tests) and observes behavior.  

Static techniques are ideal early in development—before a fully functional system exists—and excel at catching architectural or design flaws that would be costly to fix later.

### 2.2 Preliminary Code Review: Extensibility for “Medium Article” Resources

#### 2.2.1 Review Scope & Method  
- **Backend**:  
  - **Blueprints** (`src/blueprints/*.py`)  
  - **Controllers** (`src/controllers/*controller.py`)  
  - **DAO & Validators** (`src/util/dao.py`, `src/util/validators.py`)  
  - **Main app registration** (`main.py`)  
- **Frontend**:  
  - **Components** (`src/Components/*.js`)  
  - **Data converter** (`src/Util/Converter.js`)  
  - **App entry** (`App.js`)  
- **Approach**: inspected file-level coupling around the **video** resource, identified hard-coded patterns, and assessed how much of the existing structure could be reused for a new “article” resource.

#### 2.2.2 Positive Findings  
1. **DAO & Controller abstractions**  
   - `DAO` class dynamically selects MongoDB collection by name (e.g. `getDao('video')`) :contentReference[oaicite:0]{index=0}.  
   - Base `Controller` provides generic `create`, `get_all`, `get_one`, and `delete` methods, so business logic can extend it rather than rewrite CRUD from scratch :contentReference[oaicite:1]{index=1}.  
2. **Dynamic schema loading**  
   - `getValidator(collection_name)` reads `src/static/validators/{collection_name}.json`, so adding `medium.json` would automatically make a validator available :contentReference[oaicite:2]{index=2}.  
3. **Modular frontend data mapping**  
   - `Converter.convertTask()` isolates server→UI transformation; a similar function could be added for articles without touching most components :contentReference[oaicite:3]{index=3}.

#### 2.2.3 Problem Spots  
1. **Resource-specific blueprints**  
   - Each blueprint (e.g. `taskblueprint.py`) is a near-duplicate: routes and error-handling are copy/pasted. Adding “article” requires creating a third blueprint file by hand.  
2. **Manual blueprint registration**  
   - In `main.py`, each blueprint is explicitly imported and registered (`app.register_blueprint(…, url_prefix='/tasks')`, etc.). No plugin/discovery mechanism exists.  
3. **Tight coupling in controllers & converter**  
   - `TaskController.create` and `Converter.convertTask` both assume a `video` sub-document (`taskobj.video.url`), so Article entry points would require modifying both classes rather than extending them generically.  
4. **Frontend UI hard-coded to YouTube**  
   - `TaskCreator.js` label “YouTube URL” and form parameters are not abstracted; an ArticleCreator component must be built from scratch.

#### 2.2.4 Risk Rating & Effort Estimate  
- **Risk**: Medium – missing generic resource pattern means initial extension will require touching four layers (blueprint, controller, converter, UI).  
- **Effort**: Approximately 3–5 engineer-days to refactor; less if refactoring happens ahead of time.

#### 2.2.5 Recommendations  
1. **Introduce a `ResourceBlueprint` factory** that, given a collection name and schema, instantiates standard CRUD endpoints.  
2. **Auto-discover validators & DAOs** by iterating over `static/validators/*.json` and registering corresponding blueprints dynamically in `main.py`.  
3. **Parametric controllers**: modify `TaskController` (and any future ArticleController) to inherit from a generic `ResourceController`, overriding only resource-specific bits.  
4. **Generic front-end form generator**: drive field labels and inputs from a JSON config (e.g. `{ "video": ["url"], "article": ["url", "title", "author"] }`) so you avoid copying `TaskCreator.js` code.  

---

## 3 References

1. **WCAG 2.1**: Web Content Accessibility Guidelines, Level AA. W3C Recommendation (2018).  
   _Rationale:_ The globally recognized standard for web accessibility.  
2. **ISO/IEC 25010:2011**: Systems and software quality models.  
   _Rationale:_ Defines software quality attributes, including maintainability.  
3. **ISO/IEC TS 17904:2015**: Functional safety — Software safety requirements.  
   _Rationale:_ Provides terminology and principles for software safety.  
4. **axe-core**: Open-source accessibility testing engine.  
   _Rationale:_ Widely used in industry for automated audits (see https://github.com/dequelabs/axe-core).
