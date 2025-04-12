// elasticSearchService.js
const { indexPlan, updatePlan, deletePlan } = require('../elasticSearch/indexPlanData'); // Import functions from indexPlanData.js

// Index plan function
const indexPlanInElasticSearch = async (plan) => {
    try {
        // Call indexPlan from indexPlanData.js
        await indexPlan(plan); // Use the function from indexPlanData.js to index the plan and its child documents
        console.log(`Plan ${plan.objectId} indexed successfully.`);
    } catch (error) {
        console.error('Error in indexing plan:', error);
    }
};

// Update plan function
const updatePlanInElasticSearch = async (plan) => {
    try {
        // Call updatePlan from indexPlanData.js
        await updatePlan(plan); // Use the function from indexPlanData.js to update the plan and its child documents
        console.log(`Plan ${plan.objectId} updated successfully.`);
    } catch (error) {
        console.error('Error in updating plan:', error);
    }
};

// Delete plan function
const deletePlanInElasticSearch = async (planId) => {
    try {
        // Call deletePlan from indexPlanData.js
        await deletePlan(planId); // Use the function from indexPlanData.js to delete the plan and its child documents
        console.log(`Plan ${planId} deleted successfully.`);
    } catch (error) {
        console.error('Error in deleting plan:', error);
    }
};

module.exports = { indexPlanInElasticSearch, updatePlanInElasticSearch, deletePlanInElasticSearch };
