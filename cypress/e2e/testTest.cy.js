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
    cy.selectAutocomplete('State Residence', 'Connecticut');
    cy.fillInputByLabel('Your Birth Year', '2003').type('{enter}');
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
    cy.selectAutocomplete('State Residence', 'Connecticut');
    cy.fillInputByLabel('Your Birth Year', '2003').type('{enter}');
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
  });
});

describe('Investment Lists', () => {
  beforeEach(() => {
    cy.loginAsGuest();
    cy.navigateTo('Scenarios');

    // Wait for button and click it safely
    cy.contains('button', 'New Scenario').should('be.visible').click();

    // Wait for route to complete
    cy.contains('button', 'Continue').should('be.visible').click();

    // OR force the visit if backend async messes with flow
    // cy.visit('http://localhost:3000/scenario/investment_lists');
  });

  it('Navigated to Investment Lists', () => {
    cy.url().should('include', 'investment_lists');
  });

  it('should display all 3 investment tax-type sections', () => {
    // Check for section headers
    cy.contains('h5', 'Taxable').should('exist');
    cy.contains('h5', 'Tax-Deferred').should('exist');
    cy.contains('h5', 'Tax-Free').should('exist');

    // Ensure each header has a list below it
    ['Taxable', 'Tax-Deferred', 'Tax-Free'].forEach(label => {
      cy.contains('h5', label)
        .parent()
        .within(() => {
          cy.get('ul').should('exist');
        });
    });
  });

  it('Cash investment exists under the Taxable section', () => {
    cy.contains('h5', 'Taxable')
      .parent()
      .within(() => {
        cy.contains('Cash').should('exist');  // checks <ListItemText>
      });
  });

  it('Add Investment modal with all fields included', () => {
    cy.contains('button', 'Add').should('be.visible').click();

    // Wait for modal
    cy.contains('Add New Investment').should('be.visible');

    // Investment Type — just check label & dropdown
    cy.contains('Investment Type').should('be.visible');
    cy.get('input[name="investmentTypeId"]').should('exist');

    // Tax Status dropdown
    cy.contains('Tax Status of account').should('exist');
    cy.get('input[placeholder="Select"]').should('exist');

    // Value input (finds numeric input box)
    cy.contains('Value').should('exist');
    cy.get('input[type="number"]').should('exist');

    // Modal buttons
    cy.contains('button', 'Cancel').should('be.visible');
    cy.contains('button', 'Save').should('be.visible');
  });
});


describe('Investment Types', () => {
  beforeEach(() => {
    cy.loginAsGuest();
    cy.navigateTo('Scenarios');

    cy.visit('localhost:3000/scenario/investment_type');
    
  });
  
  it("Navigated to Investment Type", () => {
    cy.url().should('include', 'investment_type');
  });
  
  it('displays all required input fields and controls', () => {
    // Title/Header
    cy.contains('Investment Types').should('be.visible');

    // Left Panel Inputs
    cy.contains('Name').should('exist');
    cy.get('input').eq(0).should('exist'); // Name input

    cy.contains('Description (Optional)').should('exist');
    cy.get('textarea').should('exist'); // Description input

    cy.contains('Expense Ratio').should('exist');
    cy.get('input[type="number"]').eq(0).should('exist'); // Expense Ratio input

    cy.contains('Taxability').should('exist');
    cy.get('input[type="checkbox"]').should('exist'); // Checkbox

    // Annual Return Section
    cy.contains('Expected Annual Return:').should('exist');
    cy.contains('Amount').should('exist');
    cy.contains('Distribution').should('exist');
    cy.get('button').contains('Fixed').should('exist');
    cy.get('button').contains('Percentage').should('exist');
    cy.get('button').contains('Normal').should('exist');

    // Annual Income Section
    cy.contains('Expected Annual Income:').should('exist');
    cy.contains('Amount').should('exist');
    cy.contains('Distribution').should('exist');

    // Bottom Buttons
    cy.contains('button', 'Cancel').should('exist');
    cy.contains('button', 'Save').should('exist');
  });

  it('fills out and toggles inputs on Investment Type page', () => {
    // Fill in name
    cy.fillInputByLabel('Name', 'Test Investment Type');
    // cy.contains('Name').parent().find('input').clear().type('Test Investment Type');
  
    // Fill in description (textarea)
    cy.contains('Description (Optional)')
    .parent()
    .within(() => {
      cy.get('input, textarea').first().clear().type('This is a multiline test input.');
    });
  
    // Fill in expense ratio
    // cy.contains('Expense Ratio').parent().find('input').clear().type('0.15');
    cy.fillInputByLabel('Expense Ratio', '0.15');
  
    // Toggle taxability checkbox
    cy.contains('Taxability').parent().find('input[type="checkbox"]').check({ force: true });
  
    // Toggle annual return unit: Fixed → Percentage
// ========== Expected Annual Return ==========

        // Set toggles to "Fixed"
        // cy.contains('Amount').parent().contains('Fixed').click();
        // cy.contains('Distribution').parent().contains('Fixed').click();

        // Now wait for and type into the only visible input
        // cy.fillInputByLabel('Value', '15');
        cy.get('input').eq(3).type('15');


    // ========== Expected Annual Income ==========

        // Set toggles to "Fixed"
        // cy.contains('Amount').parent().contains('Fixed').click();
        // cy.contains('Distribution').parent().contains('Fixed').click();

        // Now wait for and type into the only visible input
        // cy.fillInputByLabel('Value', '1500');
        cy.get('input').eq(4).clear().type('30');


  
    // Optional: Submit button should now be enabled
      cy.contains('button', 'Save').should('not.be.disabled');
    });
});


describe('Event Series', () => {
  beforeEach(() => {
    cy.loginAsGuest();
    cy.navigateTo('Scenarios');

    cy.get('button.MuiButton-root').should('exist').contains('New Scenario').click();
    cy.contains('button', 'Continue').should('be.visible').click();
    cy.contains('button', 'Continue').should('be.visible').click();
  });

  it("Event Series Flow", () => {
    cy.url().should('include', 'event_series_list');
  
    // Click the Add button to open the dialog
    cy.contains('button', 'Add').click();
  
    // Dialog should appear and contain the Income button
    cy.get('.MuiDialog-root')
      .should('be.visible')
      .within(() => {
        cy.contains('button', 'Income').click();
      });
  
    // Should navigate to the income event creation page
    cy.url().should('include', '/scenario/income');
  
    // === Fill General Info (EventSeries component) ===
    cy.get('input').eq(0).type('Job Income');
    cy.get('input').eq(1).clear().type('2025{enter}');
    cy.get('input').eq(2).clear().type('2045');
  
    // === Fill Initial Income Amount ===
    cy.get('input').eq(3).first().clear().type('75000');
  
    // === Fill User Contribution if married ===
    cy.get('body').then(($body) => {
      if ($body.find('input[aria-label="User\'s Contribution"]').length) {
        cy.get('input[aria-label="User\'s Contribution"]').clear().type('60');
      }
    });
  
    // === Check Inflation Adjustment and Social Security ===
    cy.contains('Inflation Adjustment').parent().find('input[type="checkbox"]').check({ force: true });
    cy.contains('Social Security').parent().find('input[type="checkbox"]').check({ force: true });
  
    // === Annual Change Toggles ===
    cy.get('[value="normal"]').eq(2).click();
    cy.get('[value="percentage"]').click(); // Click on the Percentage rate/unit toggle
  
    // === Fill Mean and Variance ===
    cy.get('input').eq(6).type('40');
    cy.get('input').eq(7).type('3');
  
    // === Save or Save & Continue ===
    cy.contains('button', 'Save & Continue').should('not.be.disabled').click();
  
    // === Confirm redirect or success message ===
    cy.url().should('include', '/scenario/event_series_list');
  
    // Click the Add button to open the dialog
    cy.contains('button', 'Add').click();
  
    // Dialog should appear and contain the Expense button
    cy.get('.MuiDialog-root')
      .should('be.visible')
      .within(() => {
        cy.contains('button', 'Expense').click();
      });
  
    // Should navigate to the expense event creation page
    cy.url().should('include', '/scenario/expense');
  
    // === Fill General Info (EventSeries component) ===
    cy.get('input').eq(0).type('Food');
    cy.get('[value="same"]').eq(0).click();
    cy.get('input').eq(1).clear().type('Job Income{enter}');
    cy.get('input').eq(2).clear().type('80');
  
    // === Fill Initial Expense Amount ===
    cy.get('input').eq(3).first().clear().type('3000');
  
    // === Fill User Contribution if married ===
    cy.get('body').then(($body) => {
      if ($body.find('input[aria-label="User\'s Contribution"]').length) {
        cy.get('input[aria-label="User\'s Contribution"]').clear().type('60');
      }
    });
  
    // === Check Inflation Adjustment and Social Security ===
    cy.contains('Inflation Adjustment').parent().find('input[type="checkbox"]').check({ force: true });
    cy.contains('Discretionary').parent().find('input[type="checkbox"]').check({ force: true });
  
    // === Annual Change Toggles ===
    cy.get('[value="uniform"]').eq(2).click();
  
    // === Fill Min and Max ===
    cy.get('input').eq(6).type('10');
    cy.get('input').eq(7).type('30');
  
    // === Save or Save & Continue ===
    cy.contains('button', 'Save & Continue').should('not.be.disabled').click();
  
    // === Confirm redirect or success message ===
    cy.url().should('include', '/scenario/event_series_list');
  }); 
});


describe('Strategies', () => {
  beforeEach(() => {
    cy.loginAsGuest();
    cy.navigateTo('Scenarios');

    cy.get('button.MuiButton-root').should('exist').contains('New Scenario').click();
    cy.contains('button', 'Continue').should('be.visible').click();
    cy.contains('button', 'Continue').should('be.visible').click();
    cy.contains('button', 'Continue').should('be.visible').click();
    // cy.visit('localhost:3000/scenario/investment_lists');
  });
  it("Strategies", () => {
    cy.url().should('include', 'strategies');
  })
});

describe('Run Simulations', () => {
  beforeEach(() => {
    cy.loginAsGuest();
    cy.navigateTo('Scenarios');

    cy.get('button.MuiButton-root').should('exist').contains('New Scenario').click();
    cy.contains('button', 'Continue').should('be.visible').click();
    cy.contains('button', 'Continue').should('be.visible').click();
    cy.contains('button', 'Continue').should('be.visible').click();
    cy.contains('button', 'Finish').should('be.visible').click();
    // cy.visit('localhost:3000/scenario/investment_lists');
  });
  it("run_simulations", () => {
    cy.url().should('include', 'run_simulations');
  })
});