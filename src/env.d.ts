/// <reference types="astro/client" />

/* CHRISTIAN TODO: implement cookie checking via middleware, and set session on locals
Then you can delete duplicated token validation logic and possibly refresh
declare namespace App {
    interface Locals {
        error: Error;
        errorObj: any;
    }
}
*/
