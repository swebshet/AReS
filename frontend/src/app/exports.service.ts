import { Injectable } from '@angular/core';
import { utils, writeFile } from 'xlsx'
import { map, objOf, invertObj } from 'ramda'
import { Publication } from './types/publication';
import { HttpClient } from '@angular/common/http';
import { first } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { DataService } from './data.service';
import { variableLabels } from './appData'

@Injectable({
  providedIn: 'root'
})
export class ExportsService {

  private apiUrl = environment.baseApiUrl;
  private downloadUrl = environment.downloadUrl;

  constructor(private http: HttpClient, private dataService: DataService) { }

  // Creates a .xlsx file from the given publications
  exportExcel(publicationsList: Publication[], partNumber: number) {
    const excelData = publicationsList.map(p => {
      const s = p._source
      const formatted = {
        Title: s.dc_title,
        Format: s.dc_format_extent,
        Citation: s.dc_identifier_citation,
        Date: s.dc_date_issued,
        'Author(s)': s.dc_contributor_author,
        'Author(s) ORCID iD': s.cg_creator_ID,
        Publisher: s.dc_publisher,
        'ISI Status': s.cg_isijournal,
        'Publishing License': s.cg_identifier_status,
        'Funder(s)': s.dc_description_sponsorship,
        CRP: s.cg_contributor_crp,
        'Affiliation(s)': s.cg_contributor_affiliation,
        Language: s.dc_language,
        'Altmetric Mentions': s.altmetric ? s.altmetric.mentions : undefined,
        'Altmetric Readers': s.altmetric ? s.altmetric.readers : undefined,
        'Subject(s)': s.dc_subject,
        "Specie(s)": s.cg_species,
        "Animal Breed": s.cg_species_breed,
        "Region": s.cg_coverage_region,
        "Country(ies)": s.cg_coverage_country,
        'Repository(ies)': s.repo
      }
      return map(f => {
        if (Array.isArray(f)) return f.join(', ')
        else if (f === undefined) return 'None'
        else return f
      }, formatted)
    })
    const sheet = utils.json_to_sheet(excelData)
    const workBook = utils.book_new()
    utils.book_append_sheet(workBook, sheet, 'Publications')
    const fileName = `exports${(partNumber > 0 ? (' (' + partNumber) + ') ' : '')}- ${new Date()}.xlsx`
    writeFile(workBook, fileName, { bookType: 'xlsx' })
  }

  // Returns the name of the exported .docx file
  exportWord(query: any, large?: boolean): Observable<string> {
    return this.http.post(this.apiUrl + 'exporting/exports.docx', query, { responseType: 'text' }).pipe(first())
  }

  // Returns the name of the exported .pdf file.
  exportPdf(query: any) {
    return this.http.post(`${this.apiUrl}exporting/exports.pdf`, query, { responseType: 'text' }).pipe(first())
  }

  // Check out Elasticsearch Scroll API documentation for more info on scrolling.

  /**
   * Use to export huge amounts of data in .docx format.
   * @param body The full query that is used Only The First time to initialize scrolling.
   * @param init Whether or not this is the initial call to the scroll API.
   * @param partNumber The file part number.
   */
  scrollWord(body: any, init: boolean, partNumber: number) {
    return this.http.post(this.apiUrl + 'exporting/exports.docx/scroll?init=' + init + '&partNumber=' + partNumber, body)
  }

  /**
   * Use to export huge amounts of data in PDF format.
   * @param body The full query that is used Only The First time to initialize scrolling.
   * @param init Whether or not this is the initial call to the scroll API.
   * @param partNumber The file part number.
  */
  scrollPdf(body: any, init: boolean, partNumber: number) {
    return this.http.post(this.apiUrl + 'exporting/exports.pdf/scroll?init=' + init + '&partNumber=' + partNumber, body)
  }

  // Downloads the exported file
  openExportsFile(fileName: string) {
    window.open(`${this.downloadUrl}/${fileName}`)
  }

  getDownloadLinkFromFileName(fileName: string) {
    return `${this.downloadUrl}/${fileName}`
  }

  exportAggregationToExcel(variable: string) {
    this.dataService.search({
      aggs: objOf(variable, {
        terms: {
          field: variable,
          size: 2147483647
        }
      })
    }).subscribe(data => {
      const variableName = invertObj(variableLabels)[variable]
      const excelData = data.aggregations[variable].buckets
        .map(b => objOf(variableName || 'Value', b.key))
      const sheet = utils.json_to_sheet(excelData)
      const workBook = utils.book_new()
      utils.book_append_sheet(workBook, sheet, 'Values')
      const fileName = `${variableName}.xlsx`
      writeFile(workBook, fileName, { bookType: 'xlsx' })
    })
  }

}
