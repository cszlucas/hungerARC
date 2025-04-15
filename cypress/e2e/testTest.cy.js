describe("Login Page", () => {
    beforeEach(() => {
      cy.visit('localhost:3000/login'); // Adjust this if your login page is at a different route
    });

    it('displays two login buttons', () => {
      // Check the buttons exist by text
      cy.contains('Sign in with Google').should('exist');
      cy.contains('Go as Guest').should('exist');
    });
  
    it('enters as guest when guest button is clicked', () => {
      cy.contains('Go as Guest')
        .should('be.visible')
        .click();
  
      // Check if redirected to dashboard or another page
      cy.url().should('include', 'profile');
      // Optionally check for app-specific text on the landing page
      // cy.contains('Welcome, Guest').should('exist');
    });
});

describe('Guest Profile Page to Senario Nav bar test', () => {
  beforeEach(() => {
    cy.visit('localhost:3000/login');
    cy.contains('Go as Guest').click();

  });

  it('opens drawer and navigates to Scenarios page', () => {
    // Open the drawer (hamburger icon)
    cy.get('header').find('button').click();

    // Confirm drawer opens
    cy.get('.MuiDrawer-paper').should('be.visible');

    // Click on "Scenarios"
    cy.get('.MuiDrawer-paper').contains('Scenarios').click();

    // Confirm navigation occurred
    cy.url().should('include', '/scenarios');

    // Confirm URL changed
    cy.url().should('include', '/scenarios');

    // Check that the title appears
    cy.contains('Your Financial Journey').should('exist');

    // Check all buttons are rendered
    cy.contains('New Scenario').should('be.visible');
    cy.contains('Import').should('be.visible');
    cy.contains('Share').should('be.visible');
  });
});

describe('Create New Scenario', () => {
  beforeEach(() => {
    // Add protocol to avoid "invalid URL" error
    cy.visit('http://localhost:3000/login');

    // Go as Guest
    cy.contains('Go as Guest').click();

    // Open the navbar drawer
    cy.get('header').find('button').click();

    // Click "Scenarios" in the drawer
    cy.get('.MuiDrawer-paper').contains('Scenarios').click();

    // Click the "New Scenario" button
    cy.get('button.MuiButton-root').contains('New Scenario').click();
  });

  it('Goes to Basic Info Page', () => {
    cy.url().should('include', 'basics'); // or '/scenarios/basics' if that's the route
  });
  // it('Has Name', () => {

  // });
});


