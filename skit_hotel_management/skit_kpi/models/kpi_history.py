# -*- coding: utf-8 -*-

from odoo import fields, models
from datetime import datetime, timedelta


class KPIHistory(models.Model):
    """Key Performance Indicator"""

    _name = "kpi.history"
    _description = "History of the KPI"
    _order = "date desc"

    name = fields.Char('Name', size=150, required=True,
                       default=fields.Datetime.now(),)
    kpi_id = fields.Many2one('kpi', 'KPI', required=True)
    date = fields.Datetime(
        'Execution Date',
        required=True,
        readonly=True,
        default=fields.Datetime.now()
    )
    value = fields.Float('Value', required=True, readonly=True)
    target_value = fields.Float('Target Value', required=True, readonly=True)
    periodicity = fields.Char("Periodicity")
    color = fields.Char('Color', required=True,
                        readonly=True, default='#FFFFFF')
    company_id = fields.Many2one(
        'res.company', 'Company',
        default=lambda self: self.env.user.company_id.id)

    def get_history(self, from_date, to_date):
        "Fetch KPI History"

        kpi_ids = self.env['kpi'].search([])
        kpi_category = self.env['kpi.category'].search([])
        N = 7
        if(from_date and to_date):
            from_date = datetime.strptime(from_date, '%m/%d/%Y')
            to_date = datetime.strptime(to_date, '%m/%d/%Y')
            d1 = from_date.date()  # start date
            d2 = to_date.date()  # end date
            delta = d2 - d1         # timedelta
            N = delta.days + 1

        all_dates = []
        for i in range(N):
            if from_date and to_date:
                range_date = from_date + timedelta(i)
            else:
                range_date = datetime.now() - timedelta(i)
            date = datetime.strftime(range_date, "%b %d %Y")
            all_dates.append({'date': date,
                              'dates': range_date})

        kpi_history = []
        for kpi in kpi_ids:
            for category in kpi_category:
                if kpi.category_id.id == category.id:
                    kpi_history.append({'name': kpi.name,
                                        'kpi_id': kpi.id,
                                        'periodicity': kpi.periodicity_uom,
                                        'category': kpi.category_id
                                        })
        all_values = []
        cr = self.env.cr
        for kpi in kpi_history:
            for date in all_dates:
                kpi_id = kpi.get('kpi_id')
                dates = date.get('dates')
                cr.execute('''select max(id) as id from kpi_history
                where kpi_id = %s and cast(date as date) = date %s''', (kpi_id,
                                                                        dates,
                                                                        ))
                vals = cr.dictfetchall()[0]
                val = self.search([('id', '=', vals.get('id'))])
                if not val:
                    all_values.append({'kpi_id': kpi_id,
                                       'value': 0,
                                       'date': date.get('date'),
                                       'target_value': 0,
                                       'color': '#F3051B'})
                else:
                    all_values.append({'kpi_id': kpi_id,
                                       'value': val.value,
                                       'date': date.get('date'),
                                       'target_value': val.target_value,
                                       'color': val.color})
        kpi_histories = {"history": kpi_history,
                         "all_dates": all_dates,
                         "all_values": all_values,
                         }
        return kpi_histories
