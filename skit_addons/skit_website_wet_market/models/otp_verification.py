# -*- coding: utf-8 -*-

from odoo import api, fields, models
from datetime import datetime
import pytz
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT


class OTPVerification(models.Model):
    _name = 'wet.otp.verification'

    mobile = fields.Char(string="Mobile Number")
    otp = fields.Char(string="OTP Number")
    email = fields.Char(string="Email")
    company_id = fields.Many2one('res.company', string='Company',
                                 required=True, readonly=True,
                                 default=lambda self: self.env.user.company_id)

    @api.model
    def clear_otp_datas(self):
        wet_otp = self.env['wet.otp.verification'].sudo().search([])
        now = datetime.now()
        cdatetime = now.strftime("%Y-%m-%d %H:%M:%S")
        current_date = datetime.strptime(cdatetime, '%Y-%m-%d %H:%M:%S')
        for otp in wet_otp:
            user_time_zone = pytz.UTC
            if self.env.user.partner_id.tz:
                user_time_zone = pytz.timezone(self.env.user.partner_id.tz)
            cdate = (otp.create_date).strftime("%Y-%m-%d %H:%M:%S")
            utc = datetime.strptime(cdate, DEFAULT_SERVER_DATETIME_FORMAT)
            utc = utc.replace(tzinfo=pytz.UTC)
            user_time = utc.astimezone(user_time_zone).strftime(DEFAULT_SERVER_DATETIME_FORMAT)
            otp_create_date = datetime.strptime(user_time, '%Y-%m-%d %H:%M:%S')
            diff = otp_create_date - current_date
            seconds = diff.seconds
            if(seconds > 600):
                otp.unlink()
        return True
