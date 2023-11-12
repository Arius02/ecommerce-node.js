//============== class apiFeatures

import { paginationFunction } from "./paginationFunction.js";

export class ApiFeatures {
  constructor(mongooseQuery, queryData) {
    this.mongooseQuery = mongooseQuery;
    this.queryData = queryData;
  }

  pagination() {
    const { page, size } = this.queryData;
    const { limit, skip } = paginationFunction({ page, size });
    this.mongooseQuery.limit(limit).skip(skip);
    return this;
  }
  sort() {
    this.mongooseQuery.sort(this.queryData.sort?.replaceAll(",", " "));
    return this;
  }

  select() {
    this.mongooseQuery.select(this.queryData.select?.replaceAll(",", " "));
    return this;
  }

  filters() {
    const queryInstance = { ...this.queryData };
    const execludedKeys = ["page", "size", "sort", "select", "search"];
    execludedKeys.forEach((key) => delete queryInstance[key]);
    const { page, size, sort, select, search, ...queryDataV2 } = queryInstance;
    delete queryInstance["rating"];

    const queryFilter = JSON.parse(
      JSON.stringify(queryDataV2).replace(
        /\b(?:gt|gte|lt|lte|in|nin|eq|neq|regex)\b/g,
        (operator) => `$${operator}`
      )
    );
    if (queryFilter.rating&&queryFilter.rating["$in"]) {
      queryFilter.rating["$in"] = JSON.parse(queryFilter.rating["$in"]);
    }
    this.mongooseQuery.find(queryFilter);
    return this;
  }


}
