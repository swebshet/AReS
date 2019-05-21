import { Component, Input } from '@angular/core';
import { ESSource } from 'src/app/filters/services/interfaces';
import { PaginatedListConfigs } from 'src/configs/generalConfig.interface';

@Component({
  selector: 'app-link-text',
  templateUrl: './link-text.component.html',
  styleUrls: ['./link-text.component.scss']
})
export class LinkTextComponent {
  objectKeys = Object.keys;
  @Input() source: ESSource;
  @Input() content: PaginatedListConfigs;
}
