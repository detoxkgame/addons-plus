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

    def onchange_date(self, from_date, to_date, categ):
        "Fetch KPI History"
        # kpi_ids = self.env['kpi'].search([])
        # kpi_category = self.env['kpi.category'].search([])
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
        # list_arra = []
        # list_key_value = {}
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
                if kpi.periodicity_uom == 'day':
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
                elif kpi.periodicity_uom == 'month':
                        cr.execute('''select Distinct CASE WHEN
                            to_char(m.date, 'yyyy-mm-dd')=
                            to_char(CURRENT_DATE, 'yyyy-mm-dd')
                            THEN 'Current Month'
                            ELSE to_char(m.date, 'yyyy-mm-dd')
                            END as date,
                            sum(m.value) as value from kpi_history m
                            where kpi_id = %s
                            and m.periodicity = 'month'
                            group by m.date''', (kpi_id,
                                                 ))
                        s_value = cr.dictfetchall()
                        value = 0
                        threshold_obj = kpi.threshold_id
                        for x in s_value:
                            s_dates = datetime.strptime(x['date'], "%Y-%m-%d")
                            if s_dates.month == dates.month:
                                value += x['value']
                        color = threshold_obj.get_color(value)
                        all_values.append({'name': kpi.name,
                                           'kpi_id': kpi.id,
                                           'periodicity': kpi.periodicity_uom,
                                           'value': value,
                                           'date': date.get('date'),
                                           'target_value': kpi.target_value,
                                           'color': color
                                           })
                else:
                        if not val:
                            all_values.append({'name': kpi.name,
                                               'kpi_id': kpi.id,
                                               'periodicity': kpi.periodicity_uom,
                                               'value': 0,
                                               'date': date.get('date'),
                                               'target_value': 0,
                                               'color': '#F3051B'
                                               })
                        else:
                            all_values.append({'name': kpi.name,
                                               'kpi_id': kpi.id,
                                               'periodicity': kpi.periodicity_uom,
                                               'value': val.value,
                                               'date': date.get('date'),
                                               'target_value': val.target_value,
                                               'color': val.color
                                               })
        kpi_histories = {"history": kpi_history,
                         "all_dates": all_dates,
                         "all_values": all_values
                         }
        return kpi_histories

    def get_history(self):
        "Fetch KPI History"
        # kpi_ids = self.env['kpi'].search([])
        #=======================================================================
        # today = datetime.now().date()
        # start = today - timedelta(days=today.weekday())
        # end = start + timedelta(days=6)
        # print("Today: " + str(today))
        # print("Start: " + str(start))
        # print("End: " + str(end))
        #=======================================================================
        kpi_category = self.env['kpi.category'].search([])
        N = 7

        all_dates = []
        for i in range(N):
            range_date = datetime.now() - timedelta(i)
            date = datetime.strftime(range_date, "%b %d %Y")
            all_dates.append({'date': date,
                              'dates': range_date})

        kpi_history = []
        list_arra = []
        list_key_value = {}
        # categories = []
        for category in kpi_category:
            kpi_datas = self.env['kpi'].search([
                ('category_id', '=', category.id)])
            list_arra = []
            cr = self.env.cr
            for kpis in kpi_datas:
                categ_arry = []
                old_month = False
                new_month = False
                # value = 0
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
                    if kpis.periodicity_uom == 'day':
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
                    elif kpis.periodicity_uom == 'month':
                        cr.execute('''select Distinct CASE WHEN
                            to_char(m.date, 'yyyy-mm-dd')=
                            to_char(CURRENT_DATE, 'yyyy-mm-dd')
                            THEN 'Current Month'
                            ELSE to_char(m.date, 'yyyy-mm-dd')
                            END as date,
                            sum(m.value) as value from kpi_history m
                            where kpi_id = %s
                            and m.periodicity = 'month'
                            group by m.date''', (kpi_id,
                                                 ))
                        s_value = cr.dictfetchall()
                        value = 0
                        threshold_obj = kpis.threshold_id
                        for x in s_value:
                            s_dates = datetime.strptime(x['date'], "%Y-%m-%d")
                            if s_dates.month == dates.month:
                                value += x['value']
                        color = threshold_obj.get_color(value)
                        #=======================================================
                        # new_month = dates.month
                        # if old_month != new_month:
                        #     if val:
                        #         value += val.value
                        #     else:
                        #         value += 0
                        # else:
                        #     if val:
                        #         value += val.value
                        #     else:
                        #         value += 0
                        # old_month = dates.month
                        #=======================================================
                        categ_arry.append({'name': kpis.name,
                                           'kpi_id': kpis.id,
                                           'periodicity': kpis.periodicity_uom,
                                           'category': kpis.category_id.id,
                                           'value': value,
                                           'date': date.get('date'),
                                           'target_value': kpis.target_value,
                                           'color': color
                                           })
                    else:
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
                         }
        return kpi_histories
