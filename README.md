## Project Details
This project is a full-stack web application built with Next.js (App Router) that enables users to search and explore company data interactively. Users can apply filters on company metadata (name, domain, category, location, etc.), monthly spend range, technologies used (with inclusion/exclusion), and stats such as tech count and tech count per category, with support for logical operators (AND/OR/NOT). Filters are validated using Zod and structured into a search object, which is sent to the backend via Next.js API routes. The backend translates this into dynamic SQL queries against a SQLite database, returning matching results.

On the frontend, filters are organized into collapsible sections within an adjustable-width sidebar, enhanced with typeahead functionality for quick filter selection. The UI uses lucide-react icons and is styled with Tailwind CSS. Filters persist in localStorage, so they are restored on reload with relevant sections expanded, and users can reset everything with a Clear Filters button. Results are displayed in a sortable, paginated table built with shadcn/ui, with options to export to CSV or JSON and a dropdown to select visible columns. This design ensures a responsive, user-friendly UI with filtering, validation, persistence, and reset functionality.

![Search UI Demo-1](/public/assets/Search UI Demo-1.png)
![Search UI Demo-2](/public/assets/Search UI Demo-2.png)

## Data Modeling

The application uses a SQLite database.

Tables:
* companies — Stores company metadata (domain, name, category, city, state, country, zip). Indexed on frequently searched fields like domain, category, and location.
* people — Holds people associated with companies (name, title), linked via company_id.
* contacts — Stores company contacts (type, value), also linked via company_id.
* indexed_domains — Tracks domains with spend and indexing timestamps (first/last indexed).
* domain_technologies — Maps domains to technologies used, with first/last detection dates.
* technologies — Master table of technology details (name, category, description, links, public company info).
* technology_subcategories — Stores finer-grained subcategories of technologies, linked to technologies.

## Workflow

1. Filter Application/Queries/Persistence with localStorage:

* Users begin by applying filters in the sidebar. Each section (Company Metadata, Technologies, Technology Category Counts, etc.) supports either multi-selects (e.g., techs used, locations, categories) or single-value dropdowns (e.g., tech category count filter). Typeahead search has been implemented for all the dropdown selects available for technologies, supporting fuzzy matching to some extent (e.g., typing jQu matches jQuery).
* When filters are applied, they are immediately stored in localStorage → ensuring that on page reload, the saved filters are restored, relevant collapsible filter sections expand automatically, and the current search state is preserved. A Clear Filters button only appears if at least one filter is active, allowing the user to reset all filters in a single click (this also clears localStorage).

* Logical operators are supported via toggle controls.
- AND mode → e.g., “Find companies using Shopify and Stripe but not Intercom” → Include Shopify, Include Stripe, Exclude Intercom. Select And for the included techs mode to achieve this.
- OR mode → e.g., “Find companies using Shopify or Stripe but not Intercom” → Include (Any) Shopify + Stripe, Exclude Intercom. 
Select Any for the included techs mode to achieve this.

* Category counts → e.g., “Companies using >2 techs in Advertising and >3 in Analytics” → add both conditions with toggle = And. Similarly, toggle = Any for OR. This is how, Metadata + Tech combos (domain, category, HQ country + included/excluded technologies) queries are supported.

* Flow - User selects filters → Filters saved in localStorage → Clear Filters button appears → UI builds a structured search object → Sent to backend for query execution.

2. Search Object Construction & Validation:

* On the frontend, user inputs are structured into a search object.The search object is validated using Zod to ensure data integrity before sending it to the backend.
This prevents malformed queries and ensures only valid requests reach the database layer.

3. Backend Query Execution:

* The validated search object is sent via Next.js API Routes. The backend constructs a dynamic SQL query against the SQLite database, applying all filter conditions.

4. Result Display (Frontend):

* Once the backend returns the filtered dataset, the frontend renders it in a results table with following features:
* Column Sorting → Clicking any column header sorts the entire dataset (not just the visible rows) by that column. An upward arrow indicates ascending order, while a downward arrow indicates descending order.
* Pagination → Results are paginated with a customizable page size (5, 10, 20, 50, 100). Previous and Next navigation buttons are disabled when on the first or last page respectively to prevent invalid clicks.
* Export Options → CSV/JSON
* Show/Hide Columns → A toggle menu allows users to customize the table view by selecting which columns to display.

## Typeahead & Fuzzy Search

* Initially, typeahead was implemented using Fuse.js, where the entire list of options (e.g., company domains, names, technology names) was sent from the backend to the frontend, and Fuse.js performed in-memory fuzzy matching. While this worked for smaller lists, it made the page unresponsive for large datasets due to the heavy client-side search.
* To solve this, switched to an async search setup.
- On load, only the top 100 options are displayed.
- As the user types, a query is sent to the backend.
- The backend performs the search and returns a maximum of 50 most relevant matches.
- This approach keeps the UI responsive while still supporting typeahead functionality for large datasets.