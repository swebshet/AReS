import { Component, ViewChild, Output, EventEmitter } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-advanced-search-modal',
    templateUrl: './advanced-search-modal.component.html'
})
export class AdvancedSearchModalComponent {

    @Output() searchTerms = new EventEmitter<Object>()

    @ViewChild('modal') modal

    constructor(private modalService: NgbModal) { }

    show() {
        this.modalService.open(this.modal).result.then(result => this.searchTerms.emit(result))
    }
}