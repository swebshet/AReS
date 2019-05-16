
export type Publication = any

export interface Bucket {
    key: string
    doc_count: number
}

export interface PublicationCountry {
    name: string
    value: number
    code?: string
}