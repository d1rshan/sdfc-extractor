const FIELD_MAPPINGS = {
  Lead: {
    "Name": "name",
    "Lead Name": "name",
    "Lead Full Name": "name",
    "Company": "company",
    "Company / Account": "company",
    "Email": "email",
    "Phone": "phone",
    "Lead Source": "leadSource",
    "Lead Status": "leadStatus",
    "Status": "leadStatus",
    "Lead Owner": "leadOwner",
    "Owner": "leadOwner",
    "Lead Owner Alias": "leadOwner"
  },
  Contact: {
    "Name": "name",
    "Contact Name": "name",
    "Full Name": "name",
    "Email": "email",
    "Phone": "phone",
    "Business Phone": "phone",
    "Account Name": "accountName",
    "Account": "accountName",
    "Title": "title",
    "Contact Owner": "contactOwner",
    "Owner": "contactOwner",
    "Contact Owner Alias": "contactOwner",
    "Mailing Address": "mailingAddress"
  },
  Account: {
    "Account Name": "accountName",
    "Name": "accountName",
    "Website": "website",
    "Phone": "phone",
    "Industry": "industry",
    "Type": "type",
    "Account Owner": "accountOwner",
    "Owner": "accountOwner",
    "Account Owner Alias": "accountOwner",
    "Annual Revenue": "annualRevenue"
  },
  Opportunity: {
    "Opportunity Name": "name",
    "Name": "name",
    "Amount": "amount",
    "Stage": "stage",
    "Probability (%)": "probability",
    "Probability": "probability",
    "Close Date": "closeDate",
    "Forecast Category": "forecastCategory",
    "Opportunity Owner": "opportunityOwner",
    "Owner": "opportunityOwner",
    "Opportunity Owner Alias": "opportunityOwner",
    "Account Name": "associatedAccount",
    "Account": "associatedAccount"
  },
  Task: {
    "Subject": "subject",
    "Due Date": "dueDate",
    "Status": "status",
    "Priority": "priority",
    "Related To": "relatedTo",
    "Related To ID": "relatedTo",
    "Assigned To": "assignedTo",
    "Assigned To Alias": "assignedTo"
  }
};

const OBJECT_SCHEMAS = {
  Lead: [
    "name", "company", "email", "phone", 
    "leadSource", "leadStatus", "leadOwner"
  ],
  Contact: [
    "name", "email", "phone", "accountName", 
    "title", "contactOwner", "mailingAddress"
  ],
  Account: [
    "accountName", "website", "phone", "industry", 
    "type", "accountOwner", "annualRevenue"
  ],
  Opportunity: [
    "name", "amount", "stage", "probability", 
    "closeDate", "forecastCategory", "opportunityOwner", 
    "associatedAccount"
  ],
  Task: [
    "subject", "dueDate", "status", "priority", 
    "relatedTo", "assignedTo"
  ]
};