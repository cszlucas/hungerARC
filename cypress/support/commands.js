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
// Custom command to log in as a guest
Cypress.Commands.add('loginAsGuest', () => {
    cy.visit('http://localhost:3000/login');
    cy.contains('Go as Guest').click();
  });
  
  // Open the nav drawer and navigate to a section
  Cypress.Commands.add('navigateTo', (menuItem) => {
    cy.get('header').find('button').click(); // Open drawer
    cy.get('.MuiDrawer-paper').contains(menuItem).click();
  });
  
  // Select from a MUI <TextField select>
  Cypress.Commands.add('selectDropdown', (labelText, value) => {
    cy.contains(labelText)
      .parent()
      .find('.MuiSelect-select')
      .click();
    cy.get(`li[data-value="${value}"]`).click();
    cy.contains(labelText)
      .parent()
      .find('.MuiSelect-select')
      .should('contain', value);
  });
  
  // Fill a labeled input
  Cypress.Commands.add('fillInputByLabel', (labelText, value) => {
    cy.contains(labelText)
      .parent()
      .find('input')
      .clear()
      .type(value);
  });
  
  // Click a toggle button by label
  Cypress.Commands.add('selectToggle', (groupLabel, optionLabel) => {
    cy.contains(groupLabel)
      .parent()
      .within(() => {
        cy.contains(optionLabel).click();
        cy.contains(optionLabel).should('have.attr', 'aria-pressed', 'true');
      });
  });
  