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
      .type(user.email, { delay: 10 });
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
  it('TC4 - toggle active → done', () => {
    const desc = 'toggle-me';
    // Add a new todo and submit
    cy.get('[placeholder="Add a new todo item"]')
      .clear()
      .type(desc );
    cy.get('form.inline-form input[type=submit]')
      .click();
    cy.wait('@createTodo');
    cy.wait('@getTaskById');

    // Toggle checker
    cy.contains('li.todo-item', desc)
      .find('span.checker')
      .click()
      .should('have.class', 'checked');
  });

  it('TC5 - toggle done → active', () => {
    const desc = 'toggle-me';
    // Add todo
    cy.get('[placeholder="Add a new todo item"]')
      .type(desc );
    cy.get('form.inline-form input[type=submit]')
      .click();
    cy.wait('@createTodo');
    cy.wait('@getTaskById');

    // Toggle checker
    cy.contains('li.todo-item', desc)
      .find('span.checker')
      .click()
      .should('have.class', 'unchecked');
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