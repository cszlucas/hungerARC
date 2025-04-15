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

describe('Nav Bar Tests', () => {
  beforeEach(() => {
    cy.loginAsGuest();
  });

  it('Navigate to Scenarios page', () => {
    // Open the drawer (hamburger icon)
    cy.get('header').find('button').click();

    // Confirm drawer opens
    cy.get('.MuiDrawer-paper').should('be.visible');

    // Click on "Scenarios"
    cy.get('.MuiDrawer-paper').contains('Scenarios').click();

    // Confirm URL changed
    cy.url().should('include', '/scenarios');

    // Check that the title appears
    cy.contains('Your Financial Journey').should('exist');

    // Check all buttons are rendered
    cy.contains('New Scenario').should('be.visible');
    cy.contains('Import').should('be.visible');
    cy.contains('Share').should('be.visible');
  });
  it('logout', () => {
    cy.get('header').find('button').click();

    // Confirm drawer opens
    cy.get('.MuiDrawer-paper').should('be.visible');

    cy.get('.MuiDrawer-paper').contains('Logout').click();
    cy.url().should('include', 'login');


  });
});

describe('Input New Scenario', () => {
  beforeEach(() => {
    cy.loginAsGuest();
    cy.navigateTo('Scenarios');
    cy.get('button.MuiButton-root').contains('New Scenario').click();
    cy.url().should('include', 'basics');
  });

  it('has basic info', () => {
    cy.contains('Name of Scenario').should('exist');
    cy.contains('Financial Goal').should('exist');
    cy.contains('State Residence').should('exist');
    cy.contains('Your Birth Year').should('exist');
    cy.contains('Your age type').should('exist');
    cy.contains('Inflation Assumptio').should('exist');
    cy.contains('Continue').should('exist');
    cy.contains('Back').should('exist');
    cy.contains('Save').should('exist');
  });

  it('fills out Basic Info form', () => {
    cy.fillInputByLabel('Name of Scenario', 'Scenario 1');
    cy.fillInputByLabel('Financial Goal', '10000');
    cy.selectDropdown('State Residence', 'Connecticut');
    cy.fillInputByLabel('Your Birth Year', '2003');
    cy.selectToggle('Your age type', 'Normal');
    cy.fillInputByLabel('Mean', '75');
    cy.fillInputByLabel('Standard Deviation', '10');
    cy.selectToggle('Distribution', 'Fixed');
    cy.fillInputByLabel('Value', '5');
    // cy.get('button').contains('Save').click();
  });
});


describe('Save Basic Info', () => {
  beforeEach(() => {
    cy.loginAsGuest();
    cy.navigateTo('Scenarios');
    cy.get('button.MuiButton-root').contains('New Scenario').click();
    cy.url().should('include', 'basics');
    cy.fillInputByLabel('Name of Scenario', 'Scenario 1');
    cy.fillInputByLabel('Financial Goal', '10000');
    cy.selectDropdown('State Residence', 'Connecticut');
    cy.fillInputByLabel('Your Birth Year', '2003');
    cy.selectToggle('Your age type', 'Normal');
    cy.fillInputByLabel('Mean', '75');
    cy.fillInputByLabel('Standard Deviation', '10');
    cy.selectToggle('Distribution', 'Fixed');
    cy.fillInputByLabel('Value', '5');
  });

  it("Save, Go Back, Edit", () => {
    cy.get('button.MuiButton-root').contains('Save').click();
    cy.get('button.MuiButton-root').contains('Back').click();
    cy.contains('Scenario 1').should('exist');
    cy.contains('Goal: $10000').should('exist');
    cy.url().should('include', '/scenarios');

    cy.get('button[aria-label="edit"]').first().click();
    cy.url().should('include', '/scenario/basics');
  })
});



