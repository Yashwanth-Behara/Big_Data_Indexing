const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });

// Index the plan and its child objects (planCostShares, linkedPlanServices, etc.)
const indexPlan = async (plan) => {
    try {
        // 1. Index the parent Plan document
        await client.index({
            index: 'plans',
            id: plan.objectId,
            body: { 
                _org: plan._org,
                objectId: plan.objectId,
                objectType: plan.objectType,
                planType: plan.planType,
                creationDate: plan.creationDate,
                join_field: {
                    name: "plan"
                }
            },
        });
        console.log(`Plan ${plan.objectId} indexed as a parent`);

        // 2. Index the planCostShares as a single document (Child of Plan)
        const costShare = plan.planCostShares; // Treat it as an object (not an array)
        await client.index({
            index: 'plans',
            id: costShare.objectId,
            routing: plan.objectId, // Routing to ensure this is linked to the parent plan
            body: {
                deductible: costShare.deductible,
                copay: costShare.copay,
                _org: costShare._org,
                objectId: costShare.objectId,
                objectType: costShare.objectType,
                join_field: {
                    name: "planCostShares",
                    parent: plan.objectId // This is the parent-child relation
                }
            },
        });
        console.log(`Plan Cost Share ${costShare.objectId} indexed as a child`);


        // 3. Index the linkedPlanServices (Child of Plan)
        for (const linkedService of plan.linkedPlanServices) {
            await client.index({
                index: 'plans',
                id: linkedService.objectId,
                routing: plan.objectId, // Routing to ensure this is linked to the parent plan
                body: {
                    _org: linkedService._org,
                    objectId: linkedService.objectId,
                    objectType: linkedService.objectType,
                    join_field: {
                        name: "linkedPlanServices",
                        parent: plan.objectId // This is the parent-child relation
                    }
                },
            });
            console.log(`Linked Plan Service ${linkedService.objectId} indexed as a child`);

            // 4. Index the linkedService details (Child of linkedPlanService)
            await client.index({
                index: 'plans',
                id: linkedService.linkedService.objectId,
                routing: linkedService.objectId, // Routing to ensure this is linked to the linkedPlanService
                body: {
                    name: linkedService.linkedService.name,
                    _org: linkedService.linkedService._org,
                    objectId: linkedService.linkedService.objectId,
                    objectType: linkedService.linkedService.objectType,
                    join_field: {
                        name: "linkedService",
                        parent: linkedService.objectId // This is the parent-child relation
                    }
                },
            });
            console.log(`Linked Service ${linkedService.linkedService.objectId} indexed`);

            // 5. Index the planserviceCostShares (Child of linkedPlanService)
            const planserviceCostShare = linkedService.planserviceCostShares; // Now treat it as an object
            await client.index({
                index: 'plans',
                id: planserviceCostShare.objectId,
                routing: linkedService.objectId, // Routing to ensure this is linked to the linkedPlanService
                body: {
                    deductible: planserviceCostShare.deductible,
                    copay: planserviceCostShare.copay,
                    _org: planserviceCostShare._org,
                    objectId: planserviceCostShare.objectId,
                    objectType: planserviceCostShare.objectType,
                    join_field: {
                        name: "planserviceCostShares",
                        parent: linkedService.objectId // This is the parent-child relation
                    }
                },
            });
            console.log(`Plan Service Cost Share ${planserviceCostShare.objectId} indexed as a child`);
        }

    } catch (error) {
        console.error("Error indexing plan:", error);
    }
};


// Update a plan
const updatePlan = async (plan) => {
    try {
        // Delete the existing plan (parent) and its child documents first
        console.log(`Deleting plan ${plan.objectId} and its associated child documents...`);
        await deletePlan(plan.objectId);

        // Re-insert the updated plan and child documents
        console.log(`Re-inserting the updated plan ${plan.objectId}...`);
        await indexPlan(plan);
        
        console.log(`Plan ${plan.objectId} and its child documents updated successfully.`);
    } catch (error) {
        console.error("Error updating plan:", error);
    }
};



// Delete the plan and its associated child documents
const deletePlan = async (planId) => {
  try {
      // Step 1: Search for all child records (planCostShares, linkedPlanServices) of the parent plan
      const childQuery = {
          index: 'plans',
          body: {
              query: {
                  has_parent: {
                      parent_type: 'plan',
                      query: {
                          term: {
                              'objectId.keyword': planId,  // Target children by parent `objectId`
                          },
                      },
                  },
              },
          },
      };

      const childResponse = await client.search(childQuery);
      const children = childResponse.body.hits.hits;

      console.log(`Found ${children.length} child documents`);

      // Step 2: Delete all child documents
      for (const child of children) {
          const childId = child._id;
          const childType = child._source.objectType;

          console.log(`Processing child document with ID: ${childId}, type: ${childType}`);

          // If the child is of type "planservice", search for its children (grandchildren)
          if (childType === 'planservice') {
              const grandChildQuery = {
                  index: 'plans',
                  body: {
                      query: {
                          has_parent: {
                              parent_type: 'linkedPlanServices',
                              query: {
                                  term: {
                                      'objectId.keyword': childId,  // Fetch grandchildren by their parent `objectId`
                                  },
                              },
                          },
                      },
                  },
              };

              const grandChildResponse = await client.search(grandChildQuery);
              const grandChildren = grandChildResponse.body.hits.hits;

              console.log(`Found ${grandChildren.length} grandchild documents for child ID: ${childId}`);

              // Delete all grandchildren (if any)
              for (const grandChild of grandChildren) {
                  console.log(`Deleting grandchild document with ID: ${grandChild._id}`);
                  await client.delete({
                      index: 'plans',
                      id: grandChild._id,
                  });
              }
          }

          // Step 3: Delete the child document
          console.log(`Deleting child document with ID: ${childId}`);
          await client.delete({
              index: 'plans',
              id: childId,
          });
      }

      // Step 4: Delete the parent plan record (after all children and grandchildren are deleted)
      console.log(`Deleting parent record (plan) with objectId: ${planId}`);
      await client.delete({
          index: 'plans',
          id: planId,
      });

      console.log(`Plan ${planId} and its associated child documents deleted successfully.`);
  } catch (error) {
      console.error('Error deleting plan:', error);
  }
};


// Delete only specific object index
// const deletePlan = async (planId) => {
//   try {
//       // Step 1: Delete the Parent Plan document by its objectId
//       console.log(`Deleting parent plan document with ID: ${planId}`);
//       await client.delete({
//           index: 'plans',
//           id: planId,
//       });
//       console.log(`Parent Plan ${planId} deleted from Elasticsearch`);

//       // Step 2: Confirm that the children are not deleted by explicitly querying for them
//       const childQuery = {
//           index: 'plans',
//           body: {
//               query: {
//                   has_parent: {
//                       parent_type: 'plan',  // This checks for all children related to a plan
//                       query: {
//                           term: {
//                               'objectId.keyword': planId,  // Fetch child documents by parent plan ID
//                           },
//                       },
//                   },
//               },
//           },
//       };

//       const childResponse = await client.search(childQuery);
//       const children = childResponse.body.hits.hits;

//       console.log(`Found ${children.length} child documents linked to parent plan ${planId}`);

//       // No action is needed for the child documents here as we are NOT deleting them.
//       // Just logging them for confirmation.
//       for (const child of children) {
//           console.log(`Child document with ID: ${child._id} exists and is NOT deleted.`);
//       }

//       console.log(`Plan ${planId} deletion complete without deleting child documents.`);

//   } catch (error) {
//       console.error('Error deleting plan:', error);
//   }
// };


module.exports = { indexPlan, updatePlan, deletePlan };
