import { Component, Output, EventEmitter, Input, ViewChildren, QueryList, ViewChild, OnChanges } from '@angular/core'
import { NgSelectComponent } from '@ng-select/ng-select';
import * as R from 'ramda'
import { PresetOptionsService } from '../preset-options.service';

interface Filter {
  label: string, variable: string, options: string[]
}

@Component({
  selector: 'app-side-filters',
  templateUrl: './side-filters.component.html',
  styleUrls: ['./side-filters.component.css']
})
export class SideFiltersComponent implements OnChanges {

  @Input() menuFilters: Filter[] = []
  @Input() filteredFilters: Filter[] = []

  @Output() newFilters = new EventEmitter<Array<{ variable: string, values: string[] }>>()
  // Emits the index of selected preset in the presets array
  @Output() presetSelect = new EventEmitter<number>()

  @Input() set boolOperator(operator: string) {
    this.onSelectionChange()
  }

  @ViewChildren(NgSelectComponent) filterSelections: QueryList<NgSelectComponent>
  @ViewChild('years_slider') years_slider;

  titleSearchTerm: string

  selectedYearRange = [0, 1]
  minYear = 0
  maxYear = 1
  yearSliderDisabled = false
  yearSliderChangedByHand = false
  rangeYears: number[]

  constructor(public presetOptionsService: PresetOptionsService) { }

  private loadTimeoutId: any

  onSelectionChange() {
    //TODO: Simplify label matching by converting menueFilters to an object (a map).
    clearTimeout(this.loadTimeoutId)
    if (this.menuFilters && this.menuFilters.length > 0)
      this.loadTimeoutId = setTimeout(() => {
        this.yearSliderDisabled = true
        const selected = this.filterSelections.map(select => select.selectedValues)
        const filterValues = R.zip(selected, this.menuFilters)
          .map(pair => ({ variable: pair[1].variable, values: pair[0] }))
          .filter(filter => filter.values.length > 0)
        if (this.selectedYearRange[0] !== this.minYear || this.selectedYearRange[1] !== this.maxYear)
          filterValues.push({
            variable: 'year.keyword',
            values: [this.selectedYearRange[0], this.selectedYearRange[1]]
          })
        if (this.titleSearchTerm && this.titleSearchTerm !== '')
          filterValues.push({
            variable: 'dc_title',
            values: [this.titleSearchTerm]
          })
        this.newFilters.emit(filterValues)
      }, 300)
  }

  onPresetClick(presetIndex: number) {
    this.filterSelections.forEach(s => s.clearModel())
    const selectedPreset = this.presetOptionsService.presets[presetIndex]
    const filterVariables = Object.keys(selectedPreset.filters)
    for (let i = 0; i < this.filterSelections.length; i++) {
      const filterVariable = this.filteredFilters[i].variable
      if (filterVariables.includes(filterVariable)) {
        const select = this.filterSelections.toArray()[i]
        select.clearModel()
        selectedPreset.filters[filterVariable].forEach((v) => {
          if (filterVariable === 'year.keyword') this.years_slider.slider.set([v, v]);
          else select.select({ label: v, value: v });
        });
      }
    }
    this.presetSelect.emit(presetIndex)
  }

  ngOnChanges() {
    if (this.menuFilters && this.menuFilters.length > 0 && this.filteredFilters) {
      this.rangeYears = R.sort(undefined, this.filteredFilters.find(f => f.label === 'Year').options).map(y => parseInt(y))
      if (R.head(this.rangeYears) !== R.last(this.rangeYears)) {
        if (!this.yearSliderChangedByHand) {
          this.minYear = R.head(this.rangeYears)
          this.maxYear = R.last(this.rangeYears)
          this.selectedYearRange = [this.minYear, this.maxYear]
        }
      } else this.selectedYearRange = [this.minYear, this.maxYear]
      this.yearSliderDisabled = false
      this.yearSliderChangedByHand = false
    }
  }

  onTitleSearch(event) {
    if (event.key === 'Enter')
      this.onSelectionChange()
  }

  onYearSliderChange() {
    this.yearSliderChangedByHand = true
    this.onSelectionChange()
  }

  customFilterLabels = {
    "Repository": "Repository(ies)",
    "Collection": "Coummunity(ies)",
    "Region": "Region(s)",
    "Countries": "Country(ies)",
    "Author": "Author(s)",
    "Year": "Year(s)",
    "Status": "Status",
    "ISI Status": 'ISI Status',
    "Type": "Type(s)",
    "Subject": "Subject(s)",
    "Language": "Language(s)",
    "CRP": "CRP(s)",
    "Affiliation": "Author(s) Affiliation(s)",
    "Funder": "Funder(s)",
    "Specie": "Specie(s)",
    "Animal Breed": "Animal Breed(s)",
    "Author by ORCID ID": "Author(s) by ORCID ID",
    "Format": "Format(s)"
  }

  displayFilterLabel(label) {
    return this.customFilterLabels[label]
  }

}
