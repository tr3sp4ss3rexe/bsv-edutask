describe('Requirement 8 - To-do Functionality', () => {
  const taskTitle = 'Test Task';
  const youtubeKey = 'dQw4w9WgXcQ';

  beforeEach(() => {

    cy.visit('/');
    cy.login();

    // Wait for dashboard header
    cy.contains('Your tasks').should('exist');

    // Fill in task form
    cy.get('input[name="title"]').clear().type(taskTitle);
    cy.get('input[name="url"]').clear().type(youtubeKey);

    // Submit form
    cy.get('input[type="submit"]').click();

    // ✅ Wait for task to be rendered
    cy.contains(taskTitle, { timeout: 10000 }).should('exist').click();

    // ✅ Wait for to-do input field to be ready
    cy.get('input[name="title"]', { timeout: 10000 }).should('exist');
  });

  it('TC-R8UC1-01: should allow the user to create a to-do item', () => {
    cy.get('input[name="title"]').type('Test to-do item');
    cy.get('input[type="submit"]').click();
    cy.contains('Test to-do item').should('exist');
  });

  it('TC-R8UC1-02: should not allow creating an empty to-do item', () => {
    cy.get('input[name="title"]').clear();
    cy.get('[data-cy=todo-submit]').click();
    cy.contains('Please enter a valid to-do').should('exist');
  });

  it('TC-R8UC2-01: should allow marking a to-do item as done', () => {
    cy.contains('Test to-do item').parent().find('[data-cy=todo-toggle]').click();
    cy.contains('Test to-do item').should('have.class', 'completed');
  });

  it('TC-R8UC2-02: should allow toggling a to-do item back to not done', () => {
    cy.contains('Test to-do item').parent().find('[data-cy=todo-toggle]').click();
    cy.contains('Test to-do item').should('not.have.class', 'completed');
  });

  it('TC-R8UC3-01: should allow deleting a to-do item', () => {
    cy.contains('Test to-do item').parent().find('[data-cy=todo-delete]').click();
    cy.contains('Test to-do item').should('not.exist');
  });

  it('TC-R8UC3-02: gracefully handles deletion of a non-existent item', () => {
    cy.get('[data-cy=todo-delete]').should('not.exist');
  });
});
