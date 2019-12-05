# -*- coding: utf-8 -*-

from odoo import api, models


class Company(models.Model):
    _inherit = "res.company"

    @api.model
    def create(self, vals):
        """ create a new company update the company for
        all portal users. """
        company = super(Company, self).create(vals)
        res = self._cr.execute('''
            SELECT id
            FROM res_users
            WHERE share = True ''')
        res = self._cr.fetchall()
        for val in res:
            user = self.env['res.users'].browse(val)
            company_ids = user.company_ids.ids
            company_ids.append(company.id)
            user.update({'company_ids': [(6, 0, company_ids)]})
        return company
