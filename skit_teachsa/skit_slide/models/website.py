# -*- coding: utf-8 -*-
from odoo import models, fields
from odoo.http import request
import datetime
from datetime import date
class Website(models.Model):

    _inherit = "website"
    
    def get_partner(self):
        details = request.env['res.partner'].sudo().search([('issponsor', '=', 'true')])
        return details
    
    def partner_details(self):       
        details = request.env['res.partner'].sudo().search([('testimonial','!=',None),('testimonial','!=',"<p><br></p>")])
        print (details)
        return details
    
    def calender_quotes(self):
        val = date.today()
        quotes = request.env['calendar.event'].sudo().search([('start_date','=',val)])
        print (quotes)
        print(val)
        return quotes