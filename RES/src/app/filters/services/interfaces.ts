/**
 * **Elasticsearch** Elasticsearch response
 */
export interface ElasticsearchResponse {
  aggregations?: Aggregations;
  hits?: Hits;
  timed_out?: boolean;
  took?: number;
  _shards?: Shards;
}

/**
 * **Elasticsearch** Aggregations
 * * the key is one of the
 * `FilterSchema` and `SourceSchema`
 */
export interface Aggregations {
  [key: string]: AggregationsValue;
}

/**
 * **Elasticsearch** Aggregations
 */
export interface AggregationsValue {
  buckets: Bucket[];
  doc_count_error_upper_bound: number;
  sum_other_doc_count: number;
  value?: number;
  doc_count?: number;
}

/**
 * **Elasticsearch** Hits
 */
export interface Hits {
  hits: hits[];
  max_score: number;
  total: number;
}

/**
 * **Elasticsearch** hits ( aray of hists )
 */
// tslint:disable-next-line
export interface hits {
  _id: number;
  _index: string;
  _score: number;
  _source: ESSource;
  _type: string;
}

/**
 * **Elasticsearch** _source.
 * These could change based on the value
 * of `SourceSchema`, `FilterSchema`, and
 * `ListSchema`, this is why i deleted them.
 * The values from these enums are the
 * keys to this interface
 */
export interface ESSource {
  [key: string]: any;
}

/**
 * **Elasticsearch** Numbers
 */
export interface Numbers {
  downloads: number;
  score: number;
  views: number;
}

/**
 * **Elasticsearch** Bitstreams
 */
export interface Bitstreams {
  LICENSE: string;
  THUMBNAIL: string;
}

/**
 * **Elasticsearch** Altmetric
 */
export interface Altmetric {
  mentions: number;
  readers: number;
  score: number;
}

/**
 * **Elasticsearch** Shards
 */
export interface Shards {
  failed: number;
  skipped: number;
  successful: number;
  total: number;
}

/**
 * **Elasticsearch** Buckets
 */
export interface Bucket {
  key: string;
  doc_count: number;
}

export interface AggsRules {
  field: string;
  size: number;
  shard_size: number;
  order: object;
  include?: string;
}

export interface ElasticsearchQuery {
  size?: number;
  query: object;
  aggs: {
    [key: string]: AggsRules;
  };
  from?: number;
  sort: [SortOptions];
}

export interface SortOptions {
  [key: string]: {
    order: string;
    mode?: string;
  };
}

/**
 * The select components will provide data
 * hinted with this interface.
 * * the key is the source which can be found
 *   in `FilterSchema` and `SourceSchema`
 * * string[] is the selected options values
 *   and they are hinted as `(key in the Bucket interface)`
 * > this is one of the interfaces that is used
 *   to hint the **aggAttributes** in
 *   **BuilderUtilities** *which is used to build
 *   the main query*
 */
export interface QueryFilterAttribute {
  [key: string]: string[];
}

/**
 * The search components will provide data
 * hinted with this interface.
 * > this is one of the interfaces that is used
 *   to hint the **aggAttributes** in
 *   **BuilderUtilities** *which is used to build
 *   the main query*
 */
export interface QuerySearchAttribute {
  query: string;
  operator: string;
  fuzziness: string;
}

/**
 * The range component will provide
 * a gte, lte to help building the main query.
 * and effect other components query.
 * > this is one of the interfaces that is used
 *   to hint the **aggAttributes** in
 *   **BuilderUtilities** *which is used to build
 *   the main query*
 */
export interface QueryYearAttribute {
  gte: number;
  lte: number;
}

/**
 *
 * used to hint the type of the converted
 * enum to array in the **BuilderUtilities**
 * * see *BuilderUtilities.convertEnumToQueryBlock()* method
 */
export interface QueryBlock {
  source: string;
  buckets: string;
  filter?: string;
}

/**
 * used to hint the type of data that
 * components will send to their
 * services which will be used to
 * build the main query and their query
 */
export interface BuildQueryObj {
  size: number;
  term?: string;
  source?: string;
}

/**
 * used to hint the type of the reset subject
 * in the **body-builder.service.ts**
 * * caller : 'the component type'
 */
export interface ResetOptions {
  caller: ResetCaller;
}

export type ResetCaller = 'range' | 'search' | 'select';
