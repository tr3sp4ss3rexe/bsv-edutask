/// <reference types="cypress" />

describe('R8 - Todo list manipulation', () => {
  const API = 'http://localhost:5000';              // backend base
  let uid, taskId, user;

  /* ------------------------------------------------------------------ */
  /* bootstrap a fake user + task ONCE                                  */
  /* ------------------------------------------------------------------ */
  before(() => {
    cy.apiCreateUser()                              // custom command from support/commands.js
      .then(({ uid: newUid, user: newUser }) => {
        uid  = newUid;
        user = newUser;
        return cy.apiCreateTask(uid);               // returns Mongo id string
      })
      .then(id => { taskId = id; });
  });

  /* ------------------------------------------------------------------ */
  /* stub network & open the Task-detail popup (no DELETE stub)        */
  /* ------------------------------------------------------------------ */
  const loginAndOpenPopup = () => {
    const todos = [{
      _id:  'stub_todo_1',
      desc: 'initial todo',
      done: false
    }];

    const makeTaskDoc = () => ({
      _id:   { $oid: 'stub_task_1' },
      title: 'GUI-test task',
      description: 'Task created by Cypress (stub)',
      video: { url: 'dQw4w9WgXcQ' },
      todos: todos.map(t => ({
        _id: { $oid: t._id },
        description: t.desc,
        done: t.done
      }))
    });

    cy.intercept('GET', '**/tasks/ofuser/**', req => {
      req.reply(200, [makeTaskDoc()]);
    }).as('stubTasks');

    cy.intercept('GET', '**/tasks/byid/**', req => {
      req.reply(200, makeTaskDoc());
    }).as('stubTaskById');

    cy.intercept('POST', '**/todos/create', req => {
      const params = new URLSearchParams(req.body);
      const desc   = params.get('description') || '';
      const newId  = `stub_${Date.now()}`;
      todos.push({ _id: newId, desc, done: false });
      req.reply(201, { ok: true });
    }).as('stubTodoCreate');

    cy.intercept('PUT', '**/todos/byid/**', req => {
      const id   = req.url.split('/').pop();
      const todo = todos.find(t => t._id === id);
      if (todo) todo.done = !todo.done;
      req.reply(200, { ok: true });
    }).as('stubTodoToggle');

    // NOTE: no cy.intercept for DELETE – we'll hit the real API

    cy.visit('/');
    cy.contains('div', 'Email Address').find('input').type(user.email);
    cy.get('form').submit();

    cy.wait('@stubTasks');
    cy.contains('a', 'GUI-test task', { timeout: 20000 }).click();
    cy.wait('@stubTaskById');
    cy.get('.popup', { timeout: 20000 }).should('be.visible');
  };

  beforeEach(loginAndOpenPopup);

  /* ------------------------------------------------------------------ */
  /* helper: wait for next popup refresh                                */
  /* ------------------------------------------------------------------ */
  Cypress.Commands.add('waitForPopupRefresh', () => {
    cy.wait('@stubTaskById');
  });

  /* ---------------------------  R8UC1 : CREATE  ---------------------- */
  it('TC1 - add todo with 1-char description', () => {
    const desc = 'A';
    cy.get('[placeholder="Add a new todo item"]').clear().type(desc);
    cy.get('form.inline-form input[type="submit"]').click();
    cy.waitForPopupRefresh();
    cy.contains('li.todo-item', desc, { timeout: 10000 }).should('be.visible');
  });

  it('TC2 - add todo with long (200-char) description', () => {
    const desc = 'x'.repeat(200);
    cy.get('[placeholder="Add a new todo item"]').clear().type(desc);
    cy.get('form.inline-form input[type="submit"]').click();
    cy.waitForPopupRefresh();
    cy.contains('li.todo-item', desc, { timeout: 10000 }).should('be.visible');
  });

  it('TC3 – “Add” disabled for empty input', () => {
    cy.get('[placeholder="Add a new todo item"]').clear();
    cy.get('form.inline-form input[type="submit"]').should('be.disabled');
  });

  /* ---------------------------  R8UC2 : TOGGLE  ---------------------- */
  it('TC4 - toggle active → done', () => {
    const desc = 'toggle-me';
    cy.get('[placeholder="Add a new todo item"]').clear().type(desc);
    cy.get('form.inline-form input[type="submit"]').click();
    cy.waitForPopupRefresh();

    cy.contains('li.todo-item', desc).as('item');
    cy.get('@item').find('span.checker').click();
    cy.waitForPopupRefresh();
    cy.get('@item').find('span.checker').should('have.class', 'checked');
  });

  it('TC5 - toggle done → active', () => {
    const desc = 'toggle-me';
    cy.get('[placeholder="Add a new todo item"]').clear().type(desc);
    cy.get('form.inline-form input[type="submit"]').click();
    cy.waitForPopupRefresh();

    cy.contains('li.todo-item', desc).as('item');
    cy.get('@item').find('span.checker').click();
    cy.waitForPopupRefresh();
    cy.get('@item').find('span.checker').click();
    cy.waitForPopupRefresh();
    cy.contains('li.todo-item', desc)
      .find('span.checker')
      .should('have.class', 'unchecked');
  });

  /* ---------------------------  R8UC3 : DELETE  ---------------------- */
  it('TC6 – delete todo on a single click', () => {
    const desc = 'delete-me';
    cy.get('[placeholder="Add a new todo item"]').clear().type(desc);
    cy.get('form.inline-form input[type="submit"]').click();
    cy.waitForPopupRefresh();

    cy.contains('li.todo-item', desc).as('trash');
    cy.get('@trash').find('span.remover').click();
    cy.waitForPopupRefresh();

    cy.contains('li.todo-item', desc).should('not.exist');
  });

  /* ---------------------------  tear-down  ---------------------------- */
  after(() => {
    if (taskId) cy.request('DELETE', `${API}/tasks/byid/${taskId}`, { failOnStatusCode: false });
    if (uid)    cy.request('DELETE', `${API}/users/${uid}`,         { failOnStatusCode: false });
  });
});
