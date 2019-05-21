import { Client } from 'elasticsearch'
import { Queue } from 'bull'

export interface Harvester {
    repo: any
    esClient: Client;
    fetchQueue: Queue;
    indexQueue: Queue;
    fetchJobTitle: string ;
    indexJobTitle: string ;
    attempts: number
}