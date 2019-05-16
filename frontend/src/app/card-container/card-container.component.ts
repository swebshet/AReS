import { Component, Input, AfterContentInit, ContentChild, ViewChild, ElementRef } from '@angular/core';
import { trigger, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-card-container',
  templateUrl: './card-container.component.html',
  styleUrls: ['./card-container.component.css'],
  animations: [
    trigger('slideUpDown', [
      transition(':enter', [
        style({ overflow: 'hidden', height: '0', 'padding-bottom': '0', 'padding-top': '0' }),
        animate('1s ease-in', style({ height: '*', 'padding-bottom': '*', 'padding-top': '*' }))
      ]),
      transition(':leave', [
        style({ overflow: 'hidden' }),
        animate('1s ease-in', style({ height: '0', 'padding-bottom': '0', 'padding-top': '0' }))
      ])
    ])
  ]
})
export class CardContainerComponent implements AfterContentInit {

  @Input() id: string
  @Input() header: string
  @Input() popoverTitle: string
  @Input() popoverContent: string
  @Input() popoverPlacement: string
  @Input() preventScroll: boolean
  @Input() scroll_id: string;

  collapsed: boolean = false

  @ViewChild('arrow') private arrowButton: ElementRef<any>
  @ViewChild('card') cardElement: ElementRef<any>
  @ContentChild('content') content: any

  findParent(element, parent_class) {
    while ((element = element.parentElement) && !element.classList.contains(parent_class));
    return element;
  }

  findChildren(parent, child_class, children) {
    if (parent != null && parent.childNodes != null) {
      for (let i = 0; i < parent.childNodes.length; i++) {
        if (typeof parent.childNodes[i]['classList'] !== typeof undefined && parent.childNodes[i]['classList'].contains(child_class)) {
          children.push(parent.childNodes[i]);
        }
        this.findChildren(parent.childNodes[i], child_class, children);
      }
    }
    return children;
  }

  toggleDisplayNavigationElement() {
    let collapsed = this.collapsed;
    const nav_button = document.getElementById('nav-' + this.arrowButton.nativeElement.getAttribute('data-scroll_target'));
    let target_element = document.getElementById(this.arrowButton.nativeElement.getAttribute('data-scroll_target'));
    if (nav_button !== null) {
      if (!target_element['classList'].contains('section')) {
        target_element = this.findParent(target_element, 'section');
      }
      const children = this.findChildren(target_element, 'card-body', []);
      if (children.length > 0)
        collapsed = false;

      if (collapsed) {
        nav_button['style'].display = 'none';
        nav_button.classList.add('inactive');
      } else {
        nav_button['style'].display = '';
        nav_button.classList.remove('inactive');
      }
      window.dispatchEvent(new Event('scroll'));
    }
  }

  onCollapseButtonClick(toggle) {
    if (toggle)
      this.collapsed = !this.collapsed;
    setTimeout(() => {
      this.toggleDisplayNavigationElement();
    }, 1500);
  }

  ngAfterContentInit() {
    if (this.preventScroll) // If preventScroll is specified as a parameter
      window.addEventListener('click', clickEvent => {
        if (this.cardElement.nativeElement.contains(<any>clickEvent.target)) this.preventScroll = false
        else this.preventScroll = true
      })
    if (this.content && this.content.empty) // If content child emits an "empty" event
      this.content.empty.subscribe(isEmppty => {
        this.collapsed = isEmppty;
        this.onCollapseButtonClick(false);
      })
  }

}
