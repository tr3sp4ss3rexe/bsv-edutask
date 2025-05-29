/// <reference types="cypress" />
const API = Cypress.env('API');

describe('R8 - Todo list manipulation (integration)', () => {
  let uid, taskId, user;

  before(() => {
    cy.viewport(1920, 1080);
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
    // Intercepts for todos
    cy.intercept('POST', `${API}/todos/create`).as('createTodo');
    cy.intercept('PUT', `${API}/todos/byid/**`).as('toggleTodo');
    cy.intercept('DELETE', `${API}/todos/byid/**`).as('deleteTodo');

    // Login and navigate
    cy.visit('/');
    cy.contains('div', 'Email Address')
      .find('input[type=text]')
      .type(user.email, { delay: 10 });
    cy.get('form').submit();
    cy.wait('@getTasks');
    cy.contains('a', 'GUI-test task').click();
    cy.wait('@getTaskById');
    cy.get('.popup').should('be.visible');
  });

  /* CREATE */
  it('TC1 - add todo with 1-char description', () => {
    const desc = 'A';
    cy.get('[placeholder="Add a new todo item"]').type(desc);
    cy.get('form.inline-form input[type=submit]').click();
    cy.wait('@createTodo');
    cy.wait('@getTaskById');
    cy.contains('li.todo-item', desc).should('be.visible');
  });

  it('TC2 - add todo with long (200-char) description', () => {
    const desc = 'x'.repeat(200);
    cy.get('[placeholder="Add a new todo item"]').type(desc);
    cy.get('form.inline-form input[type=submit]').click();
    cy.wait('@createTodo');
    cy.wait('@getTaskById');
    cy.contains('li.todo-item', desc).should('be.visible');
  });

  it('TC3 - Add button disabled for empty input', () => {
    cy.get('[placeholder="Add a new todo item"]');
    cy.get('form.inline-form input[type=submit]').should('be.disabled');
  });

  /* TOGGLE: now fully independent with backend-driven setup & real CSS assertions */
  it('TC4 - toggle active → done', () => {
    const desc = 'toggle-active';
    // Create a fresh todo via API
    cy.apiCreateTodo(taskId, desc).then(todoId => {
      // Ensure it starts as undone
      cy.apiUpdateTodo(todoId, false);
      // Reload to fetch the new state
      cy.reload();
      cy.wait('@getTaskById');

      // Toggle and assert on actual CSS property
      cy.contains('li.todo-item', desc)
        .find('span.checker')
        .click()
        .should('have.css', 'text-decoration-line', 'line-through');
    });
  });

  it('TC5 - toggle done → active', () => {
    const desc = 'toggle-done';
    // Create a fresh todo via API
    cy.apiCreateTodo(taskId, desc).then(todoId => {
      // Ensure it starts as done
      cy.apiUpdateTodo(todoId, true);
      // Reload to fetch the new state
      cy.reload();
      cy.wait('@getTaskById');

      // Toggle and assert back to no decoration
      cy.contains('li.todo-item', desc)
        .find('span.checker')
        .click()
        .should('have.css', 'text-decoration-line', 'none');
    });
  });

  /* DELETE */
  it('TC6 – delete all existing todo items with per-item assertions', () => {
    cy.intercept('DELETE', '/todos/byid/*').as('deleteTodo');
    cy.get('li.todo-item').each(($el) => {
      const text = $el.text().trim();
      cy.contains('li.todo-item', text).should('exist');
      cy.wrap($el).find('span.remover').click();
      cy.wait('@deleteTodo');
      cy.wait('@getTaskById');
      cy.contains('li.todo-item', text).should('not.exist');
    });
  });

  after(() => {
    if (taskId) cy.apiDeleteTask(taskId);
    if (uid)    cy.apiDeleteUser(uid);
  });
});
