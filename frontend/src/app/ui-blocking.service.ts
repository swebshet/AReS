import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class UIBlockingService {

    private blocker = `
        <div name="blocker" class="black-overlay-block block-ui block-la-ball-la-fall">
            <div class="la-ball-fall">
              <div class="la-ball-ball"></div>
              <div class="la-ball-ball"></div>
              <div class="la-ball-ball"></div>
            </div>
        </div>`

    block(containerToBlock: HTMLElement) {
        this.unblock(containerToBlock)
        const blockerDiv = document.createElement('div')
        blockerDiv.innerHTML = this.blocker
        blockerDiv.id = containerToBlock.id + 'blocker'
        containerToBlock.appendChild(blockerDiv)
    }

    unblock(blockedContainer: HTMLElement) {
        try {
            blockedContainer.removeChild(document.getElementById(blockedContainer.id + 'blocker'))
        } catch (e) { }
    }

    blockById(containerId: string) {
        this.block(document.getElementById(containerId))
    }

    unblockById(containerId: string) {
        this.unblock(document.getElementById(containerId))
    }

}