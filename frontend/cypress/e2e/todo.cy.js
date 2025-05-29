/// <reference types="cypress" />
const API = Cypress.env('API');

describe('R8 - Todo list manipulation (integration)', () => {
  let uid, taskId, user;

  before(() => {
    // Consistent viewport
    cy.viewport(1920, 1080);

    // Create user and task via API
    cy.apiCreateUser()
      .then(({ uid: newUid, user: newUser }) => {
        uid  = newUid;
        user = newUser;
        return cy.apiCreateTask(uid);
      })
      .then(id => {
        taskId = id;
      });
  });

  beforeEach(() => {
    cy.viewport(1920, 1080);
    cy.intercept('GET', `${API}/tasks/ofuser/**`).as('getTasks');
    cy.intercept('GET', `${API}/tasks/byid/**`).as('getTaskById');
    cy.intercept('POST', `${API}/todos/create`).as('createTodo');
    cy.intercept('PUT', `${API}/todos/byid/**`).as('toggleTodo');
    cy.intercept('DELETE', `${API}/todos/byid/**`).as('deleteTodo');

    // Login
    cy.visit('/');
    cy.contains('div', 'Email Address')
      .find('input[type=text]')
      .type(user.email, { delay: 10 , force: true });
    cy.get('form').submit();

    // Open test task
    cy.wait('@getTasks');
    cy.contains('a', 'GUI-test task' ).click();
    cy.wait('@getTaskById');
    cy.get('.popup' ).should('be.visible');
  });

  /* CREATE */
  it('TC1 - add todo with 1-char description', () => {
    const desc = 'A';
    cy.get('[placeholder="Add a new todo item"]')
      .type(desc);
    cy.get('form.inline-form input[type=submit]')
      .click();
    cy.wait('@createTodo');
    cy.wait('@getTaskById');
    cy.contains('li.todo-item', desc).should('be.visible');
  });

  it('TC2 - add todo with long (200-char) description', () => {
    const desc = 'x'.repeat(200);
    cy.get('[placeholder="Add a new todo item"]')
      .type(desc );
    cy.get('form.inline-form input[type=submit]')
      .click();
    cy.wait('@createTodo');
    cy.wait('@getTaskById');
    cy.contains('li.todo-item', desc).should('be.visible');
  });

  it('TC3 - Add button disabled for empty input', () => {
    cy.get('[placeholder="Add a new todo item"]')
    cy.get('form.inline-form input[type=submit]').should('be.disabled');
  });

  /* TOGGLE */
  it('TC4 - clicking the checker span applies line-through text-decoration', () => {
    const desc = 'mark-me-done';

    // 1) Create in backend & ensure done=false
    cy.apiCreateTodo(taskId, desc).then(todo => {
      const id = todo._id.$oid;
      cy.apiUpdateTodo(id, { $set: { done: false } });
    });

    // 2) Close + re-open to reload from backend
    cy.get('button.close-btn').click();
    cy.contains('a', 'GUI-test task').click();
    cy.wait('@getTaskById');

    // 3) Verify it starts OFF (no line-through)
    cy.contains('li.todo-item', desc).within(() => {
      cy.get('span.editable')       // ← or '.description' if that's your text selector
        .then($el => {
          const style = window.getComputedStyle($el[0]);
          expect(style.textDecoration).not.to.include('line-through');
        });
    });

    // 4) Click & wait for the backend toggle
    cy.contains('li.todo-item', desc)
      .find('span.checker')
      .click({ force: true });
    cy.wait('@toggleTodo');

    // 5) Now assert it’s ON
    cy.contains('li.todo-item', desc).within(() => {
      cy.get('span.editable')
        .then($el => {
          const style = window.getComputedStyle($el[0]);
          expect(style.textDecoration).to.include('line-through');
        });
    });
  });

 it('TC5 - clicking the checker span removes line-through text-decoration', () => {
   const desc = 'unmark-me';

   // 1) Create + pre-mark done=true
   cy.apiCreateTodo(taskId, desc).then(todo => {
     const id = todo._id.$oid;
     cy.apiUpdateTodo(id, { $set: { done: true } });
   });

   // 2) Close + re-open
   cy.get('button.close-btn').click();
   cy.contains('a', 'GUI-test task').click();
   cy.wait('@getTaskById');

   // 3) Verify it starts ON
   cy.contains('li.todo-item', desc)
     .find('span.editable')
     .should('have.css', 'text-decoration-line', 'line-through');

   // 4) Click & wait for the toggle to hit the backend
   cy.contains('li.todo-item', desc)
     .find('span.checker')
     .click({ force: true });
   cy.wait('@toggleTodo');

  // — wait for the UI to re-fetch and render —
  cy.wait('@getTaskById');

  // 5) Assert the line-through is gone, with automatic retry
  cy.contains('li.todo-item', desc)
    .find('span.editable')
    .should('have.css', 'text-decoration-line', 'none');
 });

  /* DELETE */
  it('TC6 – delete all existing todo items with per-item assertions', () => {
    // Spy on each DELETE call
    cy.intercept('DELETE', '/todos/byid/*').as('deleteTodo');

    // Iterate over each todo item
    cy.get('li.todo-item').each(($el) => {
      const text = $el.text().trim();

      // Ensure it exists before deletion
      cy.contains('li.todo-item', text).should('exist');

      // Click its delete (×) button
      cy.wrap($el).find('span.remover').click();

      // Wait for the DELETE request and task reload
      cy.wait('@deleteTodo');
      cy.wait('@getTaskById');

      // Assert this specific item is gone
      cy.contains('li.todo-item', text).should('not.exist');
    });
  });

  after(() => {
    if (taskId) cy.apiDeleteTask(taskId);
    if (uid)    cy.apiDeleteUser(uid);
  });
});