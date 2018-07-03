import { Directive, forwardRef } from '@angular/core';
import { FormControl , AbstractControl, ValidatorFn, NG_VALIDATORS, Validator } from '@angular/forms';




function validateCoordinates() : ValidatorFn {
  return (c: AbstractControl) => {
    let isValid = false;
    if(c.value){
      var check = c.value.display_name;
      if (check) 
        isValid = true;
    }

    
    
    if(isValid) {
        return null;
    } else {
        return {
            coordinates: {
                valid: false
            }
        };
    }
  }
}



@Directive({
  selector: '[appValidateCoordinates][ngModel]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: ValidateCoordinatesDirective, multi: true }
  ]
})
export class ValidateCoordinatesDirective implements Validator{
  validator: ValidatorFn;
  constructor() { 
    this.validator = validateCoordinates();
  }

  validate(c: FormControl) {
    return this.validator(c);
  }
}
