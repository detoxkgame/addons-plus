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
    color = fields.Text('Color', required=True,
                        readonly=True, default='#FFFFFF')
    company_id = fields.Many2one(
        'res.company', 'Company',
        default=lambda self: self.env.user.company_id.id)

    def onchange_date(self, from_date, to_date, categ):
        "Fetch KPI History"
        # kpi_ids = self.env['kpi'].search([])
        kpi_category = self.env['kpi.category'].search([])
        if(from_date and to_date):
            from_date = datetime.strptime(from_date, '%m/%d/%Y')
            to_date = datetime.strptime(to_date, '%m/%d/%Y')
            d1 = from_date.date()  # start date
            d2 = to_date.date()  # end date
            delta = d2 - d1         # timedelta
            N = delta.days + 1

        all_dates = []
        for i in range(N):
            range_date = from_date + timedelta(i)
            date = datetime.strftime(range_date, "%b %d %Y")
            all_dates.append({'date': date,
                              'dates': range_date})
        kpi_datas = self.env['kpi'].search([('category_id', '=', int(categ))])

        kpi_history = []
        for kpi in kpi_datas:
            kpi_history.append({'name': kpi.name,
                                'kpi_id': kpi.id,
                                'periodicity': kpi.periodicity_uom,
                                'category': kpi.category_id
                                })
        list_arra = []
        list_key_value = {}
        # for category in kpi_category:
        all_values = []
        cr = self.env.cr
        for kpi in kpi_datas:
            for date in all_dates:
                kpi_id = kpi.id
                dates = date.get('dates')
                cr.execute('''select max(id) as id from kpi_history
                where kpi_id = %s and cast(date as date) = date %s''', (kpi_id,
                                                                        dates,
                                                                        ))
                vals = cr.dictfetchall()[0]
                val = self.search([('id', '=', vals.get('id'))])
                if not val:
                    all_values.append({'kpi_id': kpi_id,
                                       'name': kpi.name,
                                       'periodicity': kpi.periodicity_uom,
                                       'value': 0,
                                       'date': date.get('date'),
                                       'target_value': 0,
                                       'color': '#F3051B'})
                else:
                    all_values.append({'kpi_id': kpi_id,
                                       'name': kpi.name,
                                       'periodicity': kpi.periodicity_uom,
                                       'value': val.value,
                                       'date': date.get('date'),
                                       'target_value': val.target_value,
                                       'color': val.color})
        kpi_histories = {"history": kpi_history,
                         "all_dates": all_dates,
                         "all_values": all_values
                         # "kpi_ids": kpi_ids
                         }
        return kpi_histories

    def get_history(self, from_date, to_date):
        "Fetch KPI History"
        # kpi_ids = self.env['kpi'].search([])
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
        list_arra = []
        list_key_value = {}
        categories = []
        for category in kpi_category:
            kpi_datas = self.env['kpi'].search([('category_id', '=', category.id)])
            list_arra = []
            cr = self.env.cr
            for kpis in kpi_datas:
                categ_arry = []
                for date in all_dates:
                    kpi_id = kpis.id
                    dates = date.get('dates')
                    cr.execute('''select max(id) as id from kpi_history
                    where kpi_id = %s and
                    cast(date as date) = date %s''', (kpi_id,
                                                          dates,
                                                          ))
                    vals = cr.dictfetchall()[0]
                    val = self.search([('id', '=', vals.get('id'))])
                    if not val:
                        categ_arry.append({'name': kpis.name,
                                            'kpi_id': kpis.id,
                                            'periodicity': kpis.periodicity_uom,
                                            'category': kpis.category_id.id,
                                            'value': 0,
                                            'date': date.get('date'),
                                            'target_value': 0,
                                            'color': '#F3051B'
                                            })
                    else:
                        categ_arry.append({'name': kpis.name,
                                           'kpi_id': kpis.id,
                                           'periodicity': kpis.periodicity_uom,
                                           'category': kpis.category_id.id,
                                           'value': val.value,
                                           'date': date.get('date'),
                                           'target_value': val.target_value,
                                           'color': val.color
                                           })
                list_arra.append(categ_arry)
                list_key_value = list_arra
            if kpi_datas:
                kpi_history.append(list_key_value)
        kpi_histories = {"history": kpi_history,
                         "all_dates": all_dates,
                         # "kpi_ids": kpi_ids
                         }
        return kpi_histories
