import { Component, Input } from '@angular/core';
import { ESSource } from 'src/app/filters/services/interfaces';

@Component({
  selector: 'app-pub-image',
  templateUrl: './pub-image.component.html',
  styleUrls: ['./pub-image.component.scss']
})
export class PubImageComponent {
  @Input() source: ESSource;
  loading = true;

  onLoad() {
    this.loading = false;
  }
}
