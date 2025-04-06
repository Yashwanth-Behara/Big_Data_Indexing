# Big_Data_Indexing

1. Rest API that can handle any structured data in Json
2. Specify URIs, status codes, headers, data model, version
3. Rest API with support for crd operations
4. Post, Get, Delete
5. Rest API with support for validation
◦  -> Json Schema describing the data model for the use case
6. Controller validates incoming payloads against json schema
7. The semantics with ReST API operations such as update if not changed/read if changed
8. Update not required
9. Conditional read is required
10. Storage of data in key/value store - Redis
11. Must implement use case provided