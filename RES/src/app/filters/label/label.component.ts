import { Component, Input } from '@angular/core';
import { ComponentLabelConfigs } from 'src/configs/generalConfig.interface';

@Component({
  selector: 'app-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss']
})
export class LabelComponent {
  @Input() componentConfigs: ComponentLabelConfigs;
}
