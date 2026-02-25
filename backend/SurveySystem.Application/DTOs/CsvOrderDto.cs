using CsvHelper.Configuration.Attributes;
using System;
using System.Collections.Generic;
using System.Text;

namespace SurveySystem.Application.DTOs
{
    public class CsvOrderDto
    {
        [Name("id")]
        public string Id { get; set; } 

        [Name("longitude")]
        public double Longitude { get; set; }

        [Name("latitude")]
        public double Latitude { get; set; }

        [Name("timestamp")]
        public DateTime Timestamp { get; set; }

        [Name("subtotal")]
        public decimal Subtotal { get; set; }
    }
}
