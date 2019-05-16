import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { Bucket } from '../types/publication';

@Component({
  selector: 'app-bucket-display-list',
  templateUrl: './bucket-display-list.component.html',
  styleUrls: ['./bucket-display-list.component.css']
})
export class BucketDisplayListComponent implements OnChanges {

  @Input() buckets: Bucket[]

  @Output() empty = new EventEmitter<boolean>()

  ngOnChanges() {
    if (this.buckets && this.buckets.length === 0) this.empty.emit(true)
    else this.empty.emit(false)
  }

}
