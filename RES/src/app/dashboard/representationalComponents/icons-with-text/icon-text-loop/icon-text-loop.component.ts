import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon-text-loop',
  templateUrl: './icon-text-loop.component.html',
  styleUrls: ['./icon-text-loop.component.scss']
})
export class IconTextLoopComponent {
  @Input() strWithIcons: string[];
}
