import { Component } from '@angular/core';
import { Auth } from './auth.service';
import { UserData } from './user-data.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

declare var ga: any;


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
})
export class AppComponent {
    constructor(public auth: Auth, public userData: UserData, public router: Router, public activatedRoute: ActivatedRoute) {
        router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((n: NavigationEnd) => {
            const pageTitle = router.routerState.snapshot.root.children[0].data['title'];
            ga('integration.send','pageview',n.urlAfterRedirects);
        });   
    }
    switchTo(child: {id:string,name:string}) {
        // Use a URL instead of switching directly
        this.router.navigate(['child',child.id,child.name]);
    }

    
}
