// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('login', () => {
    // Load user credentials from fixture
    cy.fixture('user.json').then((user) => {
      // Visit the login page
      cy.visit('/');
  
      // Fill in the login form
      cy.contains('div', 'Email Address')
        .find('input[type=text]')
        .type(user.email);
  
      // Submit the login form
      cy.get('form').submit();
  
      // Verify successful login by checking for welcome message
      const fullName = `${user.firstName} ${user.lastName}`;
      cy.get('h1').should('contain.text', `Your tasks, ${fullName}`);
    });
  });
  
  