import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ExportsService } from '../exports.service';
import { DataService } from '../data.service';
import { map } from 'rxjs/operators';
import { range } from 'ramda'

@Component({
  selector: 'app-exports-download-modal',
  templateUrl: './exports-download-modal.component.html',
  providers: [NgbModal]
})
export class ExportsDownloadModalComponent {

  @Input() set totalOutputs(amount: number) {
    this._totalOutputs = amount
    this.outputIsLarge = amount > this.maxPartitionSize
  }

  downloadLink: string = '#'

  readonly maxPartitionSize = 2500

  constructor(
    private modal: NgbModal,
    private dataService: DataService,
    private exportsService: ExportsService) { }

  @ViewChild('modal') modalContent

  downloadComplete = false;
  isExporting = false;
  _totalOutputs: number
  outputIsLarge: boolean
  private exportButtonClickEvent: any
  private exportsQuery: any[] = []
  private partitions: any[] = []
  private sortByArray: any[] = []
  private currentScrollId: string

  show(exportButtonClickEvent: any, boolQuery: any, sortArray: any[], onConfirm?: () => void) {
    this.downloadComplete = false;
    this.isExporting = false;
    this.downloadLink = '#';
    this.exportButtonClickEvent = exportButtonClickEvent;
    this.exportsQuery = boolQuery;
    this.sortByArray = sortArray
    this.partitions = []

    this.modal.open(this.modalContent, { centered: true, keyboard: false, backdrop: 'static' }).result
      .then(() => {
        if (onConfirm) {
          onConfirm();
        }
      })
  }

  async onContinue() {
    this.isExporting = true;
    let target = this.exportButtonClickEvent.target;
    if (this.exportButtonClickEvent.target.nodeName === 'BUTTON') {
      target = this.exportButtonClickEvent.target;
    } else if (this.exportButtonClickEvent.target.parentElement.nodeName === 'BUTTON') {
      target = this.exportButtonClickEvent.target.parentElement;
    } else {
      target = this.exportButtonClickEvent.target.parentElement.parentElement;
    }
    const buttonId = target.id
    const numPartitions = this._totalOutputs % this.maxPartitionSize === 0 ?
      this._totalOutputs / this.maxPartitionSize :
      (this._totalOutputs / this.maxPartitionSize) - 1
    this.partitions = range(0, numPartitions + 1).map(i =>
      ({ part_number: i + 1 }))
    if (buttonId === 'exportExcel') {
      const scrollStream = this.dataService.scroll({
        size: this.maxPartitionSize,
        sort: this.sortByArray,
        query: { bool: this.exportsQuery }
      })
        .pipe(map((batch, index) => ({ batch, index })))
        .subscribe(data => {
          if (data.index === 0) this.currentScrollId = data.batch._scroll_id
          if (this.partitions[data.index] && data.batch._scroll_id === this.currentScrollId) {
            this.partitions[data.index].complete = true
            this.partitions[data.index].downloaded = false;
            this.partitions[data.index].onComplete = () => {
              this.partitions[data.index].downloaded = true;
              this.exportsService.exportExcel(data.batch.hits.hits, (this.outputIsLarge ? (data.index + 1) : 0));
            }
          } else scrollStream.unsubscribe()
        })
      this.downloadComplete = true
    } else if (buttonId === 'exportWord') {
      try {
        let partCounter = 1
        const initScroll = await this.exportsService.scrollWord({
          size: this.maxPartitionSize,
          sort: this.sortByArray,
          query: { bool: this.exportsQuery }
        }, true, (this.outputIsLarge ? 1 : 0)).toPromise()
        this.currentScrollId = initScroll['scroll']
        this.partitions[0].link = this.exportsService.getDownloadLinkFromFileName(initScroll['file'])
        this.partitions[0].complete = true
        this.partitions[0].downloaded = false;

        let scrollId = initScroll['scroll']
        while (this.partitions[partCounter]) {
          const next = await this.exportsService.scrollWord({ scrollId: initScroll['scroll'] }, false, (partCounter + 1)).toPromise()
          scrollId = next['scroll']
          if (scrollId !== this.currentScrollId) break
          this.partitions[partCounter].link = this.exportsService.getDownloadLinkFromFileName(next['file'])
          this.partitions[partCounter].complete = true
          this.partitions[partCounter].downloaded = false;

          partCounter++
        }
      } catch (err) {
        console.error('Error while scrolling .docx files, ', err)
      }
    } else if (buttonId === 'exportPdf') {
      try {
        let partCounter = 1
        const initScroll = await this.exportsService.scrollPdf({
          size: this.maxPartitionSize,
          sort: this.sortByArray,
          query: { bool: this.exportsQuery }
        }, true, (this.outputIsLarge ? 1 : 0)).toPromise()
        this.currentScrollId = initScroll['scroll']
        this.partitions[0].link = this.exportsService.getDownloadLinkFromFileName(initScroll['file'])
        this.partitions[0].complete = true
        this.partitions[0].downloaded = false;

        let scrollId = initScroll['scroll']
        while (this.partitions[partCounter]) {
          const next = await this.exportsService.scrollPdf({ scrollId: initScroll['scroll'] }, false, (partCounter + 1)).toPromise()
          if (scrollId !== this.currentScrollId) break
          scrollId = next['scroll']
          this.partitions[partCounter].link = this.exportsService.getDownloadLinkFromFileName(next['file'])
          this.partitions[partCounter].complete = true
          this.partitions[partCounter].downloaded = false;

          partCounter++
        }
      } catch (err) {
        console.error('Error while scrolling .pdf files: ', err)
      }
    }
  }

  onDownload() {
    this.downloadComplete = false;
    this.downloadLink = '#';
  }

  onCancel() {
    this.currentScrollId = ''
    this.onDownload()
    this.partitions = []
  }

}
