# Assignment 4 – GUI Testing

> *Authors / Work-distribution:* **Adam / Daniel**  
> *Details:* Both authors analysed the R8 requirements, implemented Cypress tests, debugged each
> other’s code, researched declarative vs imperative testing, and prepared the written material.
> Daniel drafted the discussion section; Adam converted the report to Markdown and organised the
> repository structure. 

---

## 1 · Graphical-user-interface tests (Requirement 8)

### 1.1 Test-case list (derived with equivalence + boundary analysis)

* **TC-1 Add todo – minimum length (1 char)**  
  *Pre*: popup open, input empty.  
  *Steps*: type “A” → press **Add**.  
  *Expected*: new, **active** `<li>` appended at bottom, shows “A”.

* **TC-2 Add todo – maximum accepted length (200 chars)**  
  Same as TC-1 but description is 200 × “x”.  
  *Expected*: long text rendered un-truncated.

* **TC-3 Add todo – empty description (alt 2.b)**  
  Input is cleared.  
  *Expected*: **Add button disabled** & no request is sent.<br>
  *Status with current UI*: **fails** (button never disabled).

* **TC-4 Toggle active → done**  
  Add “toggle-me”; click its checker once.  
  *Expected*: todo gains CSS class `checked` (strikethrough).

* **TC-5 Toggle done → active**  
  Same item, click checker again.  
  *Expected*: CSS class becomes `unchecked` (no strike).

* **TC-6 Delete todo**  
  Add “delete-me”; click ×.  
  *Expected*: row disappears from DOM.

### 1.2 Cypress implementation

* **Test spec** `todo.cy.js` → <[https://TODO-link/cypress/e2e/todo.cy.js](https://github.com/tr3sp4ss3rexe/bsv-edutask/blob/master/frontend/cypress/e2e/todo.cy.js)>  
* **API helpers** `commands.js` → <[https://TODO-link/cypress/support/commands.js](https://github.com/tr3sp4ss3rexe/bsv-edutask/blob/master/frontend/cypress/support/commands.js)>  

### 1.3 Execution evidence

* Interactive run ![open runner](./frontend/cypress/screenshots/npx%20cypress%20open.png)
* CLI run ![headless](./frontend/cypress/screenshots/npx%20cypress%20run.png)

**Detected system failure**

> *R8UC1 Alt 2.b*: “Add” button must remain disabled when the description is empty.  
> In the current front-end (`TaskDetail.js`) the `<input type="submit">` is never given a `disabled` prop, therefore TC-3 fails and reveals a requirement violation.

---

## 2 · Declarative vs Imperative UI testing

### 2.1 Explanation of both styles

1. **Imperative tests** express *how* to perform every interaction step-by-step — e.g.  
   `cy.get('#login').click(); cy.type('[name=pw]', 'secret'); cy.contains('OK');`  
   They mirror a human script and give full control over timing and selectors but are tightly coupled to UI detail.

2. **Declarative tests** state *what* outcome is expected, letting the framework figure out the steps — e.g.  
   ```gherkin
   WHEN I log in with valid credentials
   THEN I see my dashboard

### 2.2 Which style suits UI best

* **Imperative is needed at the lowest layer:** browsers are driven with concrete selectors and events.
* **Declarative is preferable for business intent:** tests such as “create todo” are shorter, less brittle, and readable for non-developers.

Best practice → wrap low-level imperative commands in helpers (`cy.addTodo(desc)`, `cy.toggleTodo(label)`) and compose those helpers declaratively in feature-level scenarios.

