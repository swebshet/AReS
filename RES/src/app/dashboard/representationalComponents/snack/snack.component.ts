import { Component, Input } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-snack',
  templateUrl: './snack.component.html',
  styleUrls: ['./snack.component.scss']
})
export class SnackComponent {
  @Input() set error(e: HttpErrorResponse) {
    this.messageFromStatus(e);
  }
  message: string;
  icon: string;

  private messageFromStatus({ status }: HttpErrorResponse): void {
    if (status === 400 || status === 404) {
      this.buildMessage(
        'We can not reach the server now',
        'settings_input_antenna'
      );
    } else if (status === 500) {
      this.buildMessage('Something went wrong', 'error_outline');
    } else {
      this.buildMessage('Unknown issue happened', 'report');
    }
  }

  private buildMessage(s: string, i: string): void {
    this.message = `${s}, please try again later`;
    this.icon = i;
  }
}
