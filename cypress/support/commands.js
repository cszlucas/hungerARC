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
    // Open drawer via header menu
    cy.get('header').find('button').should('be.visible').click();
  
    // Wait until drawer is fully attached, visible, and stable
    cy.get('body')
      .find('.MuiDrawer-paper', { timeout: 5000 })
      .should('exist')
      .and('be.visible');
  
    // Wait for menu item to be ready and click it
    cy.get('.MuiDrawer-paper')
      .contains(menuItem)
      .should('be.visible')
      .click();
  });
  
  
  // Select from a MUI <TextField select>
  Cypress.Commands.add('selectAutocomplete', (labelText, optionLabel) => {
    // Step 1: Find the dropdown by its label
    cy.contains(labelText)
      .should('be.visible')
      .parent() // this gets you to the Box around Typography + Autocomplete
      .within(() => {
        // Step 2: Focus the input (input inside TextField rendered by Autocomplete)
        cy.get('input').click().type(optionLabel);
      });
  
    // Step 3: Select the option from the dropdown popover
    cy.get('li[role="option"]')
      .contains(optionLabel)
      .should('be.visible')
      .click();
  
    // Step 4: Verify that the input now contains the selected label
    cy.contains(labelText)
      .parent()
      .find('input')
      .should('have.value', optionLabel);
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
  