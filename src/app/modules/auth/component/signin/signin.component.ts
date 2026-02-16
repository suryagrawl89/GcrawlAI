import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { URLS } from 'src/app/configs/api.config';
import { passwordValidator } from 'src/app/directives/form-validators.directive';
import { OtpModalComponent } from 'src/app/modules/shared/component/otp-modal/otp-modal.component';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';
import { DependencyService } from 'src/app/services/dependency.service';
import { LocalStorageService } from 'src/app/services/localstorage-service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})
export class SigninComponent {
  loginForm: FormGroup;
  unSubscribe$ = new Subject();
  activeTab: 'login' | 'signup' = 'signup';
  jsonData = JSON.stringify({
    sensor_id: "ANALYTICS_01",
    status: "ACTIVE",
    metrics: { cpu: "42%", latency: "12ms", throughput: "1.2gbps" },
    nodes: ["us-east", "eu-west", "ap-south"]
  }, null, 2);
  @ViewChild(OtpModalComponent) childOTP!: OtpModalComponent;
  logs = new Array(20).fill("FETCHING_BLOCK_RESOURCES... SUCCESS");

  constructor(private fb: FormBuilder, private toastr: ToastrService, private localService: LocalStorageService, private apiService: ApiService, private authService: AuthService, private router: Router, public ds: DependencyService, public dialog: MatDialog) {
    this.loginForm = this.fb.group({
      email: new FormControl(null, Validators.required),
      password: new FormControl(null, [Validators.required, passwordValidator()]),
      name: new FormControl('test', Validators.required)
    });
  }

  get f() { return this.loginForm.controls; }

  OnSubmit() {
    if (this.activeTab === 'login') {
      this.loginSubmit();
    } else {
      this.signUpSubmit();
    }
  }

  loginSubmit() {
    this.apiService.post(URLS.signin, this.loginForm.value, { type: 'NT' }, this.loginForm.value.user_type == 'V' ? 'TRUE' : 'FALSE').pipe((takeUntil(this.unSubscribe$))).subscribe((res: any) => {
      if (res.success === true) {
       this.authService.login(res);
      };
    })
  }

  signUpSubmit() {
    this.apiService.post(URLS.signup, this.loginForm.value, { type: 'NT' }, this.loginForm.value.user_type == 'V' ? 'TRUE' : 'FALSE').pipe((takeUntil(this.unSubscribe$))).subscribe((res: any) => {
      if (res.success === true) {
        this.openOtpModal();
      } else {
        this.toastr.error('error', res.detail)
      };
    })
  }

  openOtpModal() {
    ($('#OTPModel') as any).modal('show');
  }

  onOtpSubmit(otp: string) {
    this.validateOtp(otp);
  }

  validateOtp(otp: string) {
    const payload = {
      email: this.loginForm.value.email,
      otp: otp
    };

    this.apiService.post(URLS.verifyOtp, payload, { type: 'LO' }, 'TRUE').pipe(takeUntil(this.unSubscribe$)).subscribe((res: any) => {
      if (res) {
        this.childOTP.clearOtp();
        this.activeTab = 'login';
      } else {
        this.childOTP.isOTPInvalid = true;
      }
    });
  }

  ngOnDestroy() {
    this.unSubscribe$?.unsubscribe();
  }
}
